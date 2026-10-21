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

/** Transferências em trânsito: a mercadoria sai da origem ao enviar e só entra no destino ao receber. */
class StockTransferTransitTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Warehouse $origin;

    private Warehouse $destination;

    private Product $pen;

    private Product $ink;

    private StockService $stock;

    private StockTransferService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create(['name' => 'Empresa', 'nuit' => '123456789', 'address' => 'Maputo', 'phone' => '840000000']);
        $this->origin = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Maputo', 'code' => 'MP', 'is_active' => true]);
        $this->destination = Warehouse::create(['company_id' => $this->company->id, 'name' => 'Beira', 'code' => 'BR', 'is_active' => true]);

        foreach (['inventory.view', 'inventory.transfer'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $user = User::create(['company_id' => $this->company->id, 'name' => 'Operador', 'email' => 'o@x.test', 'password' => bcrypt('password')]);
        $user->givePermissionTo(['inventory.view', 'inventory.transfer']);
        $this->actingAs($user);

        $product = fn (string $name) => Product::create([
            'company_id' => $this->company->id, 'name' => $name, 'slug' => strtolower($name), 'sku' => strtoupper($name),
            'price' => 10, 'track_stock' => true, 'status' => 'active',
        ]);
        $this->pen = $product('Caneta');
        $this->ink = $product('Tinta');

        $this->stock = app(StockService::class);
        $this->service = app(StockTransferService::class);
    }

    private function qty(Product $product, Warehouse $warehouse): float
    {
        return (float) DB::table('product_stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->value('quantity');
    }

    /** Uma transferência da origem para o destino, já no estado indicado, com 10 canetas (e opcionalmente tinta). */
    private function transfer(string $status = 'approved', bool $withInk = false): StockTransfer
    {
        $transfer = StockTransfer::create([
            'company_id' => $this->company->id, 'from_warehouse_id' => $this->origin->id,
            'to_warehouse_id' => $this->destination->id, 'status' => $status,
        ]);
        $transfer->items()->create(['product_id' => $this->pen->id, 'quantity' => 10]);

        if ($withInk) {
            $transfer->items()->create(['product_id' => $this->ink->id, 'quantity' => 4]);
        }

        return $transfer;
    }

    public function test_shipping_takes_the_goods_out_of_the_origin_and_releases_the_reservation(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();

        $this->assertSame(10.0, $this->stock->getReserved($this->pen, $this->origin));

        $this->service->ship($transfer);

        $transfer->refresh();
        $this->assertSame('in_transit', $transfer->status);
        $this->assertNotNull($transfer->shipped_at);
        $this->assertSame(15.0, $this->qty($this->pen, $this->origin)); // saiu
        $this->assertSame(0.0, $this->qty($this->pen, $this->destination)); // ainda não chegou
        $this->assertSame(0.0, $this->stock->getReserved($this->pen, $this->origin)); // a reserva acabou: o stock já saiu
        $this->assertSame(15.0, $this->stock->getAvailable($this->pen, $this->origin));
        $this->assertSame(1, DB::table('stock_movements')->where('source_type', StockTransfer::class)->where('type', 'out')->count());
        $this->assertSame(0, DB::table('stock_movements')->where('source_type', StockTransfer::class)->where('type', 'in')->count());
    }

    public function test_shipping_without_enough_stock_is_refused_and_changes_nothing(): void
    {
        $this->stock->in($this->pen, $this->origin, 12);
        $transfer = $this->transfer('approved', withInk: true); // a tinta nunca teve stock

        try {
            $this->service->ship($transfer);
            $this->fail('Sem stock para a tinta, o envio devia ser recusado.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('Tinta', $e->errors()['stock'][0]);
        }

        $this->assertSame('approved', $transfer->fresh()->status);
        $this->assertSame(12.0, $this->qty($this->pen, $this->origin)); // as canetas já tinham saído e voltaram: tudo ou nada
    }

    public function test_only_an_approved_transfer_can_be_shipped_and_only_once(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);

        foreach (['pending', 'completed', 'cancelled'] as $status) {
            try {
                $this->service->ship($this->transfer($status));
                $this->fail("Uma transferência {$status} não se envia.");
            } catch (ValidationException) {
                // esperado
            }
        }

        $transfer = $this->transfer();
        $first = StockTransfer::find($transfer->id);
        $second = StockTransfer::find($transfer->id);

        $this->service->ship($first);

        try {
            $this->service->ship($second); // instância desatualizada: ainda a achar que está aprovada
            $this->fail('O segundo envio devia ser recusado.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('já está em trânsito', $e->errors()['status'][0]);
        }

        $this->assertSame(15.0, $this->qty($this->pen, $this->origin)); // saiu uma só vez
    }

    public function test_receiving_everything_puts_the_goods_in_the_destination(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);

        $this->service->receive($transfer);

        $transfer->refresh();
        $this->assertSame('completed', $transfer->status);
        $this->assertNotNull($transfer->received_at);
        $this->assertSame(10.0, $this->qty($this->pen, $this->destination));
        $this->assertSame(15.0, $this->qty($this->pen, $this->origin));
        $this->assertEquals(10, $transfer->items->first()->received_quantity);
        $this->assertSame(0, SystemNotification::where('type', 'transfer_discrepancy')->count());
    }

    public function test_receiving_less_records_the_difference_warns_and_does_not_put_the_missing_back(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $this->stock->in($this->ink, $this->origin, 10);
        $transfer = $this->transfer('approved', withInk: true);
        $this->service->ship($transfer);

        $penItem = $transfer->items->firstWhere('product_id', $this->pen->id);
        $inkItem = $transfer->items->firstWhere('product_id', $this->ink->id);

        $this->service->receive($transfer, [$penItem->id => 7, $inkItem->id => 4]);

        $this->assertSame(7.0, $this->qty($this->pen, $this->destination)); // chegaram 7 de 10
        $this->assertSame(4.0, $this->qty($this->ink, $this->destination));
        $this->assertSame(15.0, $this->qty($this->pen, $this->origin)); // as 3 em falta não voltam à origem
        $this->assertEquals(7, $penItem->fresh()->received_quantity);

        $warning = SystemNotification::where('type', 'transfer_discrepancy')->sole();
        $this->assertStringContainsString('Caneta: enviadas 10, recebidas 7, perda de 3', $warning->message);
        $this->assertSame('loss', $penItem->fresh()->shortage_action); // por omissão, a falta é uma perda
        $this->assertNull($inkItem->fresh()->shortage_action); // a tinta chegou toda
        $this->assertStringNotContainsString('Tinta', $warning->message);
        $this->assertSame("/inventory/transfers/{$transfer->id}", $warning->link);
    }

    public function test_a_shortage_can_be_returned_to_the_origin(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);
        $item = $transfer->items->first();

        $this->service->receive($transfer, [$item->id => 7], [$item->id => 'return']);

        $this->assertSame(7.0, $this->qty($this->pen, $this->destination)); // o que chegou
        $this->assertSame(18.0, $this->qty($this->pen, $this->origin)); // 15 que ficaram + 3 devolvidas
        $this->assertSame(25.0, $this->qty($this->pen, $this->origin) + $this->qty($this->pen, $this->destination)); // nada se perdeu
        $this->assertSame('return', $item->fresh()->shortage_action);
        $this->assertStringContainsString('3 devolvidas à origem', SystemNotification::where('type', 'transfer_discrepancy')->sole()->message);
        $this->assertSame(1, DB::table('stock_movements')->where('source_id', $transfer->id)->where('type', 'in')->where('warehouse_id', $this->origin->id)->count());
    }

    public function test_each_product_can_have_its_own_destination_for_the_difference(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $this->stock->in($this->ink, $this->origin, 10);
        $transfer = $this->transfer('approved', withInk: true);
        $this->service->ship($transfer);
        $pen = $transfer->items->firstWhere('product_id', $this->pen->id);
        $ink = $transfer->items->firstWhere('product_id', $this->ink->id);

        $this->service->receive($transfer, [$pen->id => 8, $ink->id => 1], [$pen->id => 'return', $ink->id => 'loss']);

        $this->assertSame(17.0, $this->qty($this->pen, $this->origin)); // 15 + 2 devolvidas
        $this->assertSame(6.0, $this->qty($this->ink, $this->origin)); // 10 − 4 enviadas; as 3 em falta são perda
        $this->assertSame(1.0, $this->qty($this->ink, $this->destination));
        $this->assertSame('return', $pen->fresh()->shortage_action);
        $this->assertSame('loss', $ink->fresh()->shortage_action);
    }

    public function test_an_unknown_destination_for_the_difference_is_refused_and_nothing_moves(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);
        $item = $transfer->items->first();

        try {
            $this->service->receive($transfer, [$item->id => 5], [$item->id => 'esquecer']);
            $this->fail('Um destino desconhecido devia ser recusado.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('shortage', $e->errors());
        }

        $this->assertSame('in_transit', $transfer->fresh()->status);
        $this->assertSame(0.0, $this->qty($this->pen, $this->destination));
        $this->assertSame(15.0, $this->qty($this->pen, $this->origin));

        // E no pedido HTTP o valor é validado antes de chegar ao serviço
        $this->post("/inventory/transfers/{$transfer->id}/receive", ['received' => [$item->id => 5], 'shortage' => [$item->id => 'esquecer']])
            ->assertSessionHasErrors('shortage.'.$item->id);
    }

    public function test_a_destination_chosen_for_something_that_did_not_come_short_is_ignored(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);
        $item = $transfer->items->first();

        $this->service->receive($transfer, [$item->id => 10], [$item->id => 'return']);

        $this->assertSame(15.0, $this->qty($this->pen, $this->origin)); // nada a devolver
        $this->assertNull($item->fresh()->shortage_action);
    }

    public function test_the_received_quantity_cannot_exceed_what_was_sent_or_be_negative(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);
        $item = $transfer->items->first();

        foreach ([11, -1] as $wrong) {
            try {
                $this->service->receive($transfer, [$item->id => $wrong]);
                $this->fail('A quantidade recebida devia ser recusada.');
            } catch (ValidationException $e) {
                $this->assertArrayHasKey('received', $e->errors());
            }
        }

        $this->assertSame('in_transit', $transfer->fresh()->status);
        $this->assertSame(0.0, $this->qty($this->pen, $this->destination));
    }

    public function test_a_transfer_is_received_once_and_only_when_in_transit(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);

        foreach (['pending', 'approved', 'cancelled'] as $status) {
            try {
                $this->service->receive($this->transfer($status));
                $this->fail("Uma transferência {$status} não se recebe.");
            } catch (ValidationException) {
                // esperado
            }
        }

        $transfer = $this->transfer();
        $this->service->ship($transfer);
        $first = StockTransfer::find($transfer->id);
        $second = StockTransfer::find($transfer->id);

        $this->service->receive($first);

        try {
            $this->service->receive($second);
            $this->fail('A segunda receção devia ser recusada.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('já foi recebida', $e->errors()['status'][0]);
        }

        $this->assertSame(10.0, $this->qty($this->pen, $this->destination)); // entrou uma só vez
    }

    public function test_an_in_transit_transfer_cannot_be_completed_the_old_way(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);

        try {
            $this->service->complete($transfer);
            $this->fail('Concluir uma transferência em trânsito moveria o stock duas vezes.');
        } catch (ValidationException) {
            // esperado
        }

        $this->assertSame(15.0, $this->qty($this->pen, $this->origin));
        $this->assertSame(0.0, $this->qty($this->pen, $this->destination));
    }

    public function test_cancelling_an_in_transit_transfer_returns_the_goods_to_the_origin(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);

        $this->service->cancel($transfer);

        $this->assertSame('cancelled', $transfer->fresh()->status);
        $this->assertSame(25.0, $this->qty($this->pen, $this->origin)); // voltou tudo
        $this->assertSame(0.0, $this->qty($this->pen, $this->destination));

        // E depois de cancelada já não há nada a receber nem a cancelar
        foreach ([fn () => $this->service->receive($transfer), fn () => $this->service->cancel($transfer)] as $attempt) {
            try {
                $attempt();
                $this->fail('Uma transferência cancelada não aceita mais operações.');
            } catch (ValidationException) {
                // esperado
            }
        }

        $this->assertSame(25.0, $this->qty($this->pen, $this->origin));
    }

    public function test_a_completed_transfer_cannot_be_cancelled(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);
        $this->service->receive($transfer);

        $this->expectException(ValidationException::class);

        $this->service->cancel($transfer);
    }

    public function test_the_total_stock_is_conserved_across_the_whole_trip(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $total = fn () => $this->qty($this->pen, $this->origin) + $this->qty($this->pen, $this->destination);
        $inTransit = fn () => (float) DB::table('stock_transfer_items')
            ->join('stock_transfers', 'stock_transfers.id', '=', 'stock_transfer_items.stock_transfer_id')
            ->where('stock_transfers.status', 'in_transit')->sum('stock_transfer_items.quantity');

        $this->assertSame(25.0, $total() + $inTransit());

        $this->service->ship($transfer);
        $this->assertSame(15.0, $total()); // nos armazéns
        $this->assertSame(25.0, $total() + $inTransit()); // com o que vai a caminho, tudo

        $this->service->receive($transfer);
        $this->assertSame(25.0, $total() + $inTransit());
    }

    public function test_a_warehouse_with_a_transfer_in_transit_cannot_be_deleted(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();
        $this->service->ship($transfer);
        $this->stock->out($this->pen, $this->origin, 15); // sem stock, só falta o que vai a caminho

        $user = User::first();
        $user->givePermissionTo(Permission::findOrCreate('inventory.adjust', 'web'));

        $this->delete("/inventory/warehouses/{$this->destination->id}")->assertSessionHas('error');
        $this->assertNull(Warehouse::withoutGlobalScopes()->find($this->destination->id)->deleted_at);
    }

    public function test_the_http_flow_ships_receives_and_cancels(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $transfer = $this->transfer();

        $this->post("/inventory/transfers/{$transfer->id}/ship")->assertSessionHas('success');
        $this->assertSame('in_transit', $transfer->fresh()->status);

        $this->post("/inventory/transfers/{$transfer->id}/ship")->assertSessionHas('error'); // já em trânsito

        $item = $transfer->items->first();
        // Mais do que o enviado: recusado com um aviso, e nada entra
        $this->post("/inventory/transfers/{$transfer->id}/receive", ['received' => [$item->id => 12]])->assertSessionHas('error');
        $this->assertSame(0.0, $this->qty($this->pen, $this->destination));

        $this->post("/inventory/transfers/{$transfer->id}/receive", ['received' => [$item->id => 8]])->assertSessionHas('success');
        $this->assertSame(8.0, $this->qty($this->pen, $this->destination));

        // Cancelar uma em trânsito mostra que a mercadoria voltou
        $second = $this->transfer();
        $this->post("/inventory/transfers/{$second->id}/ship");
        $this->post("/inventory/transfers/{$second->id}/cancel")->assertSessionHas('success', 'Transferência cancelada: a mercadoria voltou à origem.');
    }

    public function test_the_list_filters_in_transit_and_the_dashboard_counts_them(): void
    {
        $this->stock->in($this->pen, $this->origin, 25);
        $this->service->ship($this->transfer());
        $this->transfer('approved');
        $this->transfer('pending');

        $this->get('/inventory/transfers?status=in_transit')->assertInertia(fn (Assert $page) => $page
            ->has('transfers.data', 1)
            ->where('transfers.data.0.status', 'in_transit')
        );

        $this->get('/inventory')->assertInertia(fn (Assert $page) => $page
            ->where('queue.transfers_in_transit', 1)
            ->where('queue.transfers_approved', 1)
            ->where('queue.transfers_pending', 1)
        );
    }
}
