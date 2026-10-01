<?php

namespace Database\Seeders\Demo;

use App\Models\Catalog\Branch;
use App\Models\Inventory\Warehouse;
use App\Models\Pos\CashRegister;
use Illuminate\Database\Seeder;

/**
 * Caixas do POS (com a configuração de impressão de cada uma).
 *
 * Só a empresa com plano "crescimento" tem POS, e esse plano permite 2 caixas.
 * Não cria turnos nem vendas: abre o turno e vende na aplicação para testar o fluxo real.
 * As séries do POS (P{id}) nascem na primeira venda de cada caixa.
 */
class DemoPosSeeder extends Seeder
{
    /**
     * nuit da empresa => caixas. 'driver' browser é o único que funciona sem hardware;
     * para testar ESC/POS mude para 'qz' (printer_name) ou 'network' (printer_host).
     */
    public static function registers(): array
    {
        return [
            DemoCompanySeeder::NUIT_KUTENGA => [
                [
                    'name' => 'Caixa 1 - Maputo',
                    'branch' => 'MATRIZ',
                    'warehouse' => 'LJ-01',
                    'printer_driver' => 'browser',
                    'paper_width' => 80,
                    'auto_print' => false,
                ],
                [
                    'name' => 'Caixa 2 - Beira',
                    'branch' => 'BEIRA',
                    'warehouse' => 'ARM-02',
                    'printer_driver' => 'browser',
                    'paper_width' => 58,
                    'auto_print' => false,
                ],
            ],
        ];
    }

    public function run(): void
    {
        foreach (DemoCompanySeeder::demoCompanies() as $company) {
            foreach (self::registers()[$company->nuit] ?? [] as $data) {
                $branchId = Branch::where('company_id', $company->id)->where('code', $data['branch'])->value('id');
                $warehouseId = Warehouse::where('company_id', $company->id)->where('code', $data['warehouse'])->value('id');

                $register = CashRegister::withTrashed()->firstOrNew(['company_id' => $company->id, 'name' => $data['name']]);

                $register->fill([
                    'branch_id' => $branchId,
                    'warehouse_id' => $warehouseId,
                    'printer_driver' => $data['printer_driver'],
                    'paper_width' => $data['paper_width'],
                    'auto_print' => $data['auto_print'],
                    'is_active' => true,
                ])->save();

                if ($register->trashed()) {
                    $register->restore();
                }
            }
        }
    }
}
