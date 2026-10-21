<?php

namespace Tests\Feature;

use App\Models\Catalog\Product;
use App\Models\Company;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\Warehouse;
use App\Models\SystemNotification;
use App\Models\User;
use App\Services\Inventory\StockService;
use App\Services\Inventory\StockTransferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/** Receber uma transferência em várias vezes: o que falta pode ainda vir a caminho. */
class StockTransferPartialReceiptTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Warehouse $origin;

    private Warehouse $destination;

    private Product $pen;

    private Product $ink;

    private StockService $stock;

    private StockTransferService $service;

    private StockTransfer $transfer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000']);
        $this->origin = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Maputo', 'code' => 'MP', 'is_active' => true]);
        $this->destination = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Beira', 'code' => 'BR', 'is_active' => true]);

        foreach (['inventory.view', 'inventory.transfer', 'inventory.receive'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $user = User::create(['company_id' => $this->company->id, 'name' => 'Operador', 'email' => 'o@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo(['inventory.view', 'inventory.transfer', 'inventory.receive']);
        $this->actingAs($user);

        $product = fn (string $name) => Product::create([
            'company_id' => $this->company->id, 'name' => $name, 'slug' => strtolower($name), 'sku' => strtoupper($name),
            'price' => 10, 'cost' => 10, 'track_stock' => true, 'status' => 'active',
        ]);
        $this->pen = $product('Caneta');
        $this->ink = $product('Tinta');

        $this->stock = app(StockService::class);
        $this->service = app(StockTransferService::class);

        // 25 canetas e 10 tintas na origem; seguem 10 canetas e 4 tintas
        $this->stock->in($this->pen, $this->origin, 25);
        $this->stock->in($this->ink, $this->origin, 10);

        $this->transfer = StockTransfer::create([
            'company_id' => $this->company->id, 'from_warehouse_id' => $this->origin->id,
            'to_warehouse_id' => $this->destination->id, 'status' => 'approved',
        ]);
        $this->transfer->items()->create(['product_id' => $this->pen->id, 'quantity' => 10]);
        $this->transfer->items()->create(['product_id' => $this->ink->id, 'quantity' => 4]);
        $this->service->ship($this->transfer);
    }

    private function qty(Product $product, Warehouse $warehouse): float
    {
        return (float) DB::table('product_stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->value('quantity');
    }

    private function item(Product $product)
    {
        return $this->transfer->items()->where('product_id', $product->id)->first();
    }

    public function test_a_first_partial_receipt_keeps_the_rest_on_its_way(): void
    {
        $pen = $this->item($this->pen);
        $ink = $this->item($this->ink);

        $this->service->receive($this->transfer, [$pen->id => 6, $ink->id => 4], [$pen->id => 'pending']);

        $this->assertSame('in_transit', $this->transfer->fresh()->status); // ainda há canetas a caminho
        $this->assertNull($this->transfer->fresh()->received_at);
        $this->assertSame(6.0, $this->qty($this->pen, $this->destination));
        $this->assertSame(4.0, $this->qty($this->ink, $this->destination));
        $this->assertEquals(6, $pen->fresh()->received_quantity);
        $this->assertEquals(4, $pen->fresh()->remaining);
        $this->assertEquals(0, $ink->fresh()->remaining); // a tinta já chegou toda
        $this->assertNull($pen->fresh()->shortage_action); // nada foi dado como perdido
        $this->assertSame(0, SystemNotification::where('type', 'transfer_discrepancy')->count()); // ainda não há diferença, há espera
    }

    public function test_the_rest_can_arrive_later_and_completes_the_transfer(): void
    {
        $pen = $this->item($this->pen);
        $this->service->receive($this->transfer, [$pen->id => 6], [$pen->id => 'pending']);

        $this->service->receive($this->transfer, [$pen->id => 4]); // por omissão, o resto que falta, e a tinta que ainda falta

        $this->assertSame('completed', $this->transfer->fresh()->status);
        $this->assertNotNull($this->transfer->fresh()->received_at);
        $this->assertSame(10.0, $this->qty($this->pen, $this->destination));
        $this->assertSame(4.0, $this->qty($this->ink, $this->destination)); // a tinta, nunca recebida antes, chega agora
        $this->assertEquals(10, $pen->fresh()->received_quantity);
        $this->assertSame(0, SystemNotification::where('type', 'transfer_discrepancy')->count());
    }

    public function test_the_second_receipt_can_close_what_is_still_missing_as_a_loss(): void
    {
        $pen = $this->item($this->pen);
        $ink = $this->item($this->ink);
        $this->service->receive($this->transfer, [$pen->id => 6, $ink->id => 4], [$pen->id => 'pending']);

        $this->service->receive($this->transfer, [$pen->id => 2], [$pen->id => 'loss']);

        $this->assertSame('completed', $this->transfer->fresh()->status);
        $this->assertSame(8.0, $this->qty($this->pen, $this->destination));
        $this->assertSame('loss', $pen->fresh()->shortage_action);
        $this->assertSame(15.0, $this->qty($this->pen, $this->origin)); // as 2 perdidas não voltam
        $this->assertStringContainsString('Caneta: enviadas 10, recebidas 8, perda de 2', SystemNotification::where('type', 'transfer_discrepancy')->sole()->message);
    }

    public function test_the_missing_can_be_returned_to_the_origin_after_a_partial_receipt(): void
    {
        $pen = $this->item($this->pen);
        $ink = $this->item($this->ink);
        $this->service->receive($this->transfer, [$pen->id => 6, $ink->id => 4], [$pen->id => 'pending']);

        $this->service->receive($this->transfer, [$pen->id => 0], [$pen->id => 'return']); // nada chegou; devolve as 4 que faltam

        $this->assertSame('completed', $this->transfer->fresh()->status);
        $this->assertSame(6.0, $this->qty($this->pen, $this->destination));
        $this->assertSame(19.0, $this->qty($this->pen, $this->origin)); // 15 + as 4 devolvidas
        $this->assertSame('return', $pen->fresh()->shortage_action);
        $this->assertSame(25.0, $this->qty($this->pen, $this->origin) + $this->qty($this->pen, $this->destination)); // nada se perdeu
    }

    public function test_one_product_can_close_while_another_keeps_on_its_way(): void
    {
        $pen = $this->item($this->pen);
        $ink = $this->item($this->ink);

        // Canetas: chegam 10 e fecha. Tinta: chega 1 e as 3 que faltam ainda vêm
        $this->service->receive($this->transfer, [$pen->id => 10, $ink->id => 1], [$ink->id => 'pending']);

        $this->assertSame('in_transit', $this->transfer->fresh()->status);
        $this->assertEquals(0, $pen->fresh()->remaining);
        $this->assertEquals(3, $ink->fresh()->remaining);

        // Receber mais canetas já não é possível: não falta nenhuma
        try {
            $this->service->receive($this->transfer, [$pen->id => 1, $ink->id => 3]);
            $this->fail('Não há canetas a caminho.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('Caneta', $e->errors()['received'][0]);
        }

        $this->service->receive($this->transfer, [$ink->id => 3]);
        $this->assertSame('completed', $this->transfer->fresh()->status);
        $this->assertSame(4.0, $this->qty($this->ink, $this->destination));
    }

    public function test_one_cannot_receive_more_than_what_is_still_on_its_way(): void
    {
        $pen = $this->item($this->pen);
        $this->service->receive($this->transfer, [$pen->id => 6], [$pen->id => 'pending']);

        try {
            $this->service->receive($this->transfer, [$pen->id => 5], [$pen->id => 'pending']); // só faltam 4
            $this->fail('Mais do que falta devia ser recusado.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('entre 0 e 4', $e->errors()['received'][0]);
        }

        $this->assertSame(6.0, $this->qty($this->pen, $this->destination));
        $this->assertEquals(6, $pen->fresh()->received_quantity);
    }

    public function test_a_receipt_that_changes_nothing_is_refused(): void
    {
        $pen = $this->item($this->pen);
        $ink = $this->item($this->ink);

        try {
            $this->service->receive($this->transfer, [$pen->id => 0, $ink->id => 0], [$pen->id => 'pending', $ink->id => 'pending']);
            $this->fail('Receber nada e não resolver nada devia ser recusado.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('received', $e->errors());
        }

        $this->assertSame('in_transit', $this->transfer->fresh()->status);
        $this->assertSame(0.0, $this->qty($this->pen, $this->destination));
    }

    public function test_the_same_quantity_cannot_be_received_twice_from_stale_pages(): void
    {
        $pen = $this->item($this->pen);
        $ink = $this->item($this->ink);
        $first = StockTransfer::find($this->transfer->id);
        $second = StockTransfer::find($this->transfer->id);

        $this->service->receive($first, [$pen->id => 6, $ink->id => 4], [$pen->id => 'pending']);

        // A segunda página ainda mostrava 10 por receber: agora só há 4
        try {
            $this->service->receive($second, [$pen->id => 10, $ink->id => 4], [$pen->id => 'pending']);
            $this->fail('A segunda receção devia ser recusada.');
        } catch (ValidationException) {
            // esperado
        }

        $this->assertSame(6.0, $this->qty($this->pen, $this->destination)); // entrou uma só vez
    }

    public function test_after_a_partial_receipt_the_transfer_can_no_longer_be_cancelled(): void
    {
        $pen = $this->item($this->pen);
        $this->service->receive($this->transfer, [$pen->id => 6], [$pen->id => 'pending']);

        try {
            $this->service->cancel($this->transfer);
            $this->fail('Cancelar depois de uma receção parcial devia ser recusado.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('recebida em parte', $e->errors()['status'][0]);
        }

        $this->assertSame('in_transit', $this->transfer->fresh()->status);
        $this->assertSame(6.0, $this->qty($this->pen, $this->destination));
    }

    public function test_what_is_still_on_its_way_follows_the_remaining_not_the_shipped_quantity(): void
    {
        $pen = $this->item($this->pen);
        $ink = $this->item($this->ink);
        $this->service->receive($this->transfer, [$pen->id => 6, $ink->id => 4], [$pen->id => 'pending']);

        // Página do produto: só os 4 que faltam, não os 10 enviados
        $this->get("/inventory/stocks/{$this->pen->id}")->assertInertia(fn (Assert $page) => $page
            ->has('in_transit', 1)
            ->where('in_transit.0.quantity', 4)
            ->where('stocks', fn ($lines) => collect($lines)->every(
                fn ($line) => (float) $line['incoming'] === ($line['warehouse_id'] === $this->destination->id ? 4.0 : 0.0)
            ))
        );

        // A tinta já chegou toda: não aparece como a caminho
        $this->get("/inventory/stocks/{$this->ink->id}")->assertInertia(fn (Assert $page) => $page->has('in_transit', 0));

        // Valor em trânsito: 4 canetas × 10
        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page->where('stats.in_transit_value', 40));

        // Quando as canetas que faltam são dadas como perdidas, deixam de estar a caminho
        $this->service->receive($this->transfer, [$pen->id => 0], [$pen->id => 'loss']);

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page->where('stats.in_transit_value', 0));
    }

    public function test_the_list_marks_partly_received_transfers_and_the_page_gives_what_is_left(): void
    {
        $other = StockTransfer::create(['company_id' => $this->company->id, 'from_warehouse_id' => $this->origin->id, 'to_warehouse_id' => $this->destination->id, 'status' => 'in_transit']);
        $other->items()->create(['product_id' => $this->pen->id, 'quantity' => 2]);

        $pen = $this->item($this->pen);
        $this->service->receive($this->transfer, [$pen->id => 6], [$pen->id => 'pending']);

        $rows = collect($this->get('/inventory/transfers?status=in_transit')->viewData('page')['props']['transfers']['data'])->keyBy('id');
        $this->assertTrue((bool) $rows[$this->transfer->id]['is_partial']);
        $this->assertFalse((bool) $rows[$other->id]['is_partial']);

        $this->get("/inventory/transfers/{$this->transfer->id}")->assertInertia(fn (Assert $page) => $page
            ->where('transfer.items', fn ($items) => collect($items)->contains(fn ($i) => $i['id'] === $pen->id && (float) $i['remaining'] === 4.0))
        );
    }

    public function test_the_http_flow_accepts_the_pending_choice(): void
    {
        $pen = $this->item($this->pen);
        $ink = $this->item($this->ink);

        $this->post("/inventory/transfers/{$this->transfer->id}/receive", [
            'received' => [$pen->id => 6, $ink->id => 4],
            'shortage' => [$pen->id => 'pending'],
        ])->assertSessionHas('success');

        $this->assertSame('in_transit', $this->transfer->fresh()->status);

        $this->post("/inventory/transfers/{$this->transfer->id}/receive", ['shortage' => [$pen->id => 'esquecer']])
            ->assertSessionHasErrors('shortage.'.$pen->id);
    }
}
