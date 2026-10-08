<?php

namespace App\Services\Printing;

use App\Models\Billing\Document;
use App\Models\Company;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use App\Models\User;
use App\Support\PrinterHost;
use Illuminate\Support\Collection;
use RuntimeException;

/**
 * Dados e saídas de impressão do POS.
 *
 * Os mesmos dados alimentam duas saídas: HTML (browser) e ESC/POS (QZ Tray / rede).
 * Para suportar outro driver basta consumir `*Data()` ou `*EscPos()` no PosPrintController.
 */
class PosPrintService
{
    public const METHODS = ['cash' => 'Dinheiro', 'card' => 'TPA / Cartão', 'transfer' => 'Transferência'];

    public function paperWidth(?Company $company, ?CashRegister $register = null): int
    {
        return (int) ($register?->paper_width ?: $company?->thermal_paper_width ?: 80);
    }

    // ── Dados dos relatórios ────────────────────────────────────────────────

    public function shiftSummaryData(PosShift $shift): array
    {
        $shift->loadMissing(['user', 'cashRegister', 'company']);

        $totals = $shift->status === 'closed' && $shift->payment_totals
            ? $shift->payment_totals
            : $shift->paymentTotals();

        $docs = $shift->documents()->where('status', '!=', 'cancelled')->count();
        $expected = $shift->expected_cash !== null
            ? (float) $shift->expected_cash
            : (float) $shift->starting_cash + $totals['cash'];

        $summary = [
            ['Fundo de maneio', $shift->starting_cash],
            ['Vendas ('.$docs.')', array_sum($totals)],
            ['  Dinheiro', $totals['cash']],
            ['  Cartão / TPA', $totals['card']],
            ['  Transferência', $totals['transfer']],
            ['Dinheiro esperado', $expected],
        ];

        if ($shift->ending_cash !== null) {
            $summary[] = ['Dinheiro contado', $shift->ending_cash];
            $summary[] = ['Diferença', $shift->cash_difference];
        }

        return $this->report($shift->company, $shift->cashRegister, 'Resumo do Turno #'.$shift->id, $this->shiftMeta($shift), $summary, collect());
    }

    public function shiftSalesData(PosShift $shift): array
    {
        $shift->loadMissing(['user', 'cashRegister', 'company']);

        $rows = $this->salesRows($shift->documents()->getQuery());

        return $this->report($shift->company, $shift->cashRegister, 'Vendas do Turno #'.$shift->id, $this->shiftMeta($shift), $this->methodSummary($rows), $rows);
    }

    public function dayData(User $user, bool $allRegisters, ?CashRegister $register = null): array
    {
        $shiftIds = PosShift::where('company_id', $user->company_id)
            ->when(! $allRegisters, fn ($q) => $q->where('user_id', $user->id))
            ->pluck('id');

        $rows = $this->salesRows(
            Document::where('company_id', $user->company_id)
                ->where('source_module', 'pos')
                ->whereIn('pos_shift_id', $shiftIds)
                ->whereDate('created_at', today())
        );

        return $this->report(
            $user->company,
            $register,
            'Vendas do Dia',
            [now()->format('d/m/Y'), $allRegisters ? 'Todas as caixas' : 'Operador: '.$user->name],
            $this->methodSummary($rows),
            $rows
        );
    }

    public function testData(CashRegister $register): array
    {
        $register->loadMissing('company');

        return $this->report($register->company, $register, 'Teste de Impressão', [$register->name], [
            ['Driver', strtoupper($register->printer_driver)],
            ['Largura do papel', $this->paperWidth($register->company, $register).' mm'],
            ['Acentos', 'ção áé õü ç'],
        ], collect(), false);
    }

    private function report(?Company $company, ?CashRegister $register, string $title, array $meta, array $summary, Collection $rows, bool $money = true): array
    {
        return [
            'company' => $company,
            'paperWidth' => $this->paperWidth($company, $register),
            'title' => $title,
            'meta' => $meta,
            'summary' => $summary,
            'rows' => $rows,
            'isMoney' => $money,
        ];
    }

    private function shiftMeta(PosShift $shift): array
    {
        return array_values(array_filter([
            $shift->cashRegister?->name,
            'Operador: '.$shift->user?->name,
            'Abertura: '.$shift->opened_at->format('d/m/Y H:i'),
            $shift->closed_at ? 'Fecho: '.$shift->closed_at->format('d/m/Y H:i') : 'Turno em curso',
        ]));
    }

    /** @return Collection<int, array{number: string, time: string, total: float, method: string}> */
    private function salesRows($documentsQuery): Collection
    {
        return $documentsQuery
            ->where('status', '!=', 'cancelled')
            ->with('paymentAllocations.payment')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($doc) => [
                'number' => $doc->document_number ?? '—',
                'time' => $doc->created_at->format('H:i'),
                'total' => (float) $doc->grand_total,
                'method' => $doc->paymentAllocations->first()?->payment?->payment_method ?? 'cash',
            ]);
    }

    private function methodSummary(Collection $rows): array
    {
        $summary = [['Total ('.$rows->count().' vendas)', $rows->sum('total')]];

        foreach (self::METHODS as $key => $label) {
            $summary[] = ['  '.$label, $rows->where('method', $key)->sum('total')];
        }

        return $summary;
    }

    // ── ESC/POS ─────────────────────────────────────────────────────────────

    public function reportEscPos(array $data): EscPos
    {
        $esc = new EscPos($data['paperWidth']);
        $company = $data['company'];
        $methods = ['cash' => 'Dinheiro', 'card' => 'Cartão', 'transfer' => 'Transf.'];
        $fmt = fn ($v) => number_format((float) $v, 2, ',', '.').' MT';

        $esc->centered($company?->name ?? 'Kutenga', true);

        if ($company?->nuit) {
            $esc->centered('NUIT: '.$company->nuit);
        }

        $esc->feed()->centered(mb_strtoupper($data['title']), true);

        foreach ($data['meta'] as $line) {
            $esc->centered($line);
        }

        $esc->centered('Impresso: '.now()->format('d/m/Y H:i'))->separator();

        foreach ($data['summary'] as [$label, $value]) {
            $bold = ! str_starts_with($label, ' ');
            $esc->bold($bold)->pair($label, $data['isMoney'] ? $fmt($value) : (string) $value)->bold(false);
        }

        if (count($data['rows'])) {
            $esc->separator();

            foreach ($data['rows'] as $row) {
                $esc->pair(
                    $row['time'].' '.$row['number'].' '.($methods[$row['method']] ?? $row['method']),
                    number_format($row['total'], 2, ',', '.')
                );
            }
        }

        return $esc->separator()->centered('Kutenga ERP')->cut();
    }

    public function receiptEscPos(Document $document, int $paperWidth, bool $openDrawer): EscPos
    {
        $document->loadMissing(['items', 'company', 'paymentAllocations.payment', 'posShift.user', 'posShift.cashRegister']);

        $esc = new EscPos($paperWidth);
        $company = $document->company;
        $fmt = fn ($v) => number_format((float) $v, 2, ',', '.');
        $payment = $document->paymentAllocations->first()?->payment;

        if ($openDrawer && $payment?->payment_method === 'cash') {
            $esc->openDrawer();
        }

        $esc->centered($company?->name ?? 'Kutenga', true, 2);

        if ($company?->address) {
            $esc->centered(str_replace(["\r", "\n"], ' ', $company->address));
        }

        if ($company?->phone) {
            $esc->centered('Tel: '.$company->phone);
        }

        if ($company?->nuit) {
            $esc->centered('NUIT: '.$company->nuit);
        }

        $esc->separator()
            ->centered(mb_strtoupper(self::documentTitle($document)), true)
            ->centered($document->document_number ?? 'RASCUNHO', true)
            ->centered(($document->issue_date ?? now())->format('d/m/Y').' '.($document->created_at ?? now())->format('H:i'));

        if ($document->status === 'cancelled') {
            $esc->centered('*** DOCUMENTO CANCELADO ***', true);
        }

        $esc->separator()
            ->line('Cliente: '.$document->customer_name)
            ->line('NUIT: '.$document->customer_nuit)
            ->separator();

        foreach ($document->items as $item) {
            $esc->bold()->line($item->product_name)->bold(false);

            $detail = $fmt($item->quantity).' x '.$fmt($item->unit_price);

            if ((float) $item->discount_percent > 0) {
                $detail .= ' (-'.$fmt($item->discount_percent).'%)';
            }

            $esc->pair($detail, $fmt($item->total));
        }

        $esc->separator()->pair('Subtotal', $fmt($document->subtotal).' MT');

        if ((float) $document->discount_total > 0) {
            $esc->pair('Desconto', '-'.$fmt($document->discount_total).' MT');
        }

        $taxByRate = $document->items
            ->groupBy(fn ($i) => number_format((float) $i->tax_rate, 0))
            ->map(fn ($rows) => $rows->sum(
                fn ($i) => (float) $i->total - ((float) $i->quantity * (float) $i->unit_price * (1 - (float) $i->discount_percent / 100))
            ));

        foreach ($taxByRate as $rate => $amount) {
            $esc->pair('IVA ('.$rate.'%)', $fmt($amount).' MT');
        }

        $esc->separator()->bold()->size(2)->pair('TOTAL', $fmt($document->grand_total))->size(1)->bold(false);

        if ($payment) {
            $esc->separator()->pair('Pagamento', self::METHODS[$payment->payment_method] ?? $payment->payment_method);

            if ($payment->payment_method === 'cash' && $payment->amount_tendered !== null) {
                $esc->pair('Entregue', $fmt($payment->amount_tendered).' MT')
                    ->pair('Troco', $fmt($payment->change_given ?? 0).' MT');
            }
        }

        if ($shift = $document->posShift) {
            $esc->separator()->centered('Operador: '.$shift->user?->name.($shift->cashRegister ? ' | '.$shift->cashRegister->name : ''));
        }

        return $esc->separator()
            ->centered($company?->receipt_footer ?: 'Obrigado pela preferência!')
            ->centered('Kutenga ERP')
            ->cut();
    }

    public static function documentTitle(Document $document): string
    {
        if ($document->source_module === 'pos' && $document->document_type === 'FR') {
            return 'Venda a Dinheiro';
        }

        return [
            'FT' => 'Fatura a Crédito',
            'FR' => 'Fatura-Recibo',
            'CT' => 'Cotação / Orçamento',
            'NC' => 'Nota de Crédito',
            'ND' => 'Nota de Débito',
            'GR' => 'Guia de Remessa',
            'RC' => 'Recibo',
        ][$document->document_type] ?? 'Fatura-Recibo';
    }

    // ── Envio ───────────────────────────────────────────────────────────────

    /** Envia bytes brutos para uma impressora de rede (RAW, normalmente porta 9100). */
    public function sendToNetwork(CashRegister $register, string $bytes): void
    {
        if (! $register->printer_host) {
            throw new RuntimeException('A caixa não tem o endereço da impressora configurado.');
        }

        // Liga ao IP já validado (não ao nome) e só às portas de impressão permitidas
        $port = (int) ($register->printer_port ?: 9100);

        if (! in_array($port, config('pos.printer_ports'), true)) {
            throw new RuntimeException('A porta da impressora não é permitida.');
        }

        $ip = PrinterHost::safeIp($register->printer_host);

        $socket = @stream_socket_client(
            'tcp://'.(str_contains($ip, ':') ? "[$ip]" : $ip).':'.$port,
            $errno,
            $error,
            3
        );

        if (! $socket) {
            throw new RuntimeException("Não foi possível ligar à impressora ({$register->printer_host}).");
        }

        stream_set_timeout($socket, 5);
        $written = @fwrite($socket, $bytes);
        fclose($socket);

        if ($written === false || $written < strlen($bytes)) {
            throw new RuntimeException('A impressora não recebeu o documento completo.');
        }
    }
}
