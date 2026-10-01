<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\Billing\Document;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use App\Services\Printing\PosPrintService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

/**
 * Impressão do POS: recibo da venda e relatórios de turno/dia.
 *
 * - Rotas HTML (`receipt`, `shift*`, `daySales`, `test`): talão com impressão automática no browser.
 * - `job`: devolve ao cliente o que o driver da caixa precisa (URL, bytes ESC/POS para o QZ Tray)
 *   ou, no driver de rede, envia diretamente para a impressora a partir do servidor.
 */
class PosReceiptController extends Controller
{
    public function __construct(private PosPrintService $printing)
    {
    }

    private function canViewAll(): bool
    {
        return Auth::user()->hasAnyRole(['Admin', 'owner', 'Manager']);
    }

    // ── HTML (driver "browser") ─────────────────────────────────────────────

    public function receipt(int $id)
    {
        return view('pdf.thermal', ['document' => $this->loadDocument($id), 'autoprint' => true]);
    }

    public function shiftSummary(PosShift $shift)
    {
        $this->authorizeShift($shift);

        return view('pos.thermal-report', $this->printing->shiftSummaryData($shift));
    }

    public function shiftSales(PosShift $shift)
    {
        $this->authorizeShift($shift);

        return view('pos.thermal-report', $this->printing->shiftSalesData($shift));
    }

    public function daySales()
    {
        return view('pos.thermal-report', $this->dayData());
    }

    public function test(CashRegister $register)
    {
        $this->authorizeRegister($register);

        return view('pos.thermal-report', $this->printing->testData($register));
    }

    // ── Trabalho de impressão (drivers "qz" e "network") ────────────────────

    /**
     * GET /pos/print/job?type=receipt|shift-summary|shift-sales|day|test&id=…
     */
    public function job(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:receipt,shift-summary,shift-sales,day,test',
            'id' => 'nullable|integer',
        ]);

        $user = Auth::user();
        $type = $validated['type'];
        $id = $validated['id'] ?? null;

        $register = null;
        $htmlUrl = null;
        $escpos = null;

        switch ($type) {
            case 'receipt':
                $document = $this->loadDocument((int) $id);
                $register = $document->posShift?->cashRegister;
                $htmlUrl = route('pos.receipts.show', $document->id, false);
                $escpos = fn () => $this->printing->receiptEscPos(
                    $document,
                    $this->printing->paperWidth($document->company, $register),
                    (bool) $register?->open_drawer
                );
                break;

            case 'shift-summary':
            case 'shift-sales':
                $shift = PosShift::findOrFail((int) $id);
                $this->authorizeShift($shift);
                $register = $shift->cashRegister;
                $htmlUrl = route($type === 'shift-summary' ? 'pos.shifts.print.summary' : 'pos.shifts.print.sales', $shift->id, false);
                $escpos = fn () => $this->printing->reportEscPos(
                    $type === 'shift-summary' ? $this->printing->shiftSummaryData($shift) : $this->printing->shiftSalesData($shift)
                );
                break;

            case 'day':
                $register = $this->currentRegister();
                $htmlUrl = route('pos.print.day', [], false);
                $escpos = fn () => $this->printing->reportEscPos($this->dayData($register));
                break;

            case 'test':
                $register = CashRegister::findOrFail((int) $id);
                $this->authorizeRegister($register);
                $htmlUrl = route('pos.registers.print.test', $register->id, false);
                $escpos = fn () => $this->printing->reportEscPos($this->printing->testData($register));
                break;
        }

        $driver = $register?->printer_driver ?? 'browser';

        if ($driver === 'browser' || !$register) {
            return response()->json(['driver' => 'browser', 'url' => $htmlUrl]);
        }

        $bytes = $escpos();

        if ($driver === 'qz') {
            return response()->json([
                'driver' => 'qz',
                'printer' => $register->printer_name,
                'data' => $bytes->base64(),
                'fallback_url' => $htmlUrl,
            ]);
        }

        // driver "network": o servidor envia diretamente para a impressora
        try {
            $this->printing->sendToNetwork($register, $bytes->bytes());
        } catch (Throwable $e) {
            report($e);

            return response()->json(['driver' => 'network', 'error' => $e->getMessage(), 'fallback_url' => $htmlUrl], 502);
        }

        return response()->json(['driver' => 'network', 'printed' => true]);
    }

    // ── Auxiliares ──────────────────────────────────────────────────────────

    private function loadDocument(int $id): Document
    {
        $document = Document::where('company_id', Auth::user()->company_id)
            ->with(['items', 'series', 'company', 'posShift.user', 'posShift.cashRegister', 'paymentAllocations.payment'])
            ->findOrFail($id);

        $this->authorizeShift($document->posShift);

        return $document;
    }

    private function dayData(?CashRegister $register = null): array
    {
        return $this->printing->dayData(Auth::user(), $this->canViewAll(), $register ?? $this->currentRegister());
    }

    /** Caixa do turno aberto do utilizador (define o papel e o driver das impressões do dia). */
    private function currentRegister(): ?CashRegister
    {
        $user = Auth::user();

        return PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->first()?->cashRegister;
    }

    private function authorizeShift(?PosShift $shift): void
    {
        $user = Auth::user();

        abort_unless($shift && $shift->company_id === $user->company_id, 403);
        abort_unless($this->canViewAll() || $shift->user_id === $user->id, 403, 'Não autorizado.');
    }

    private function authorizeRegister(CashRegister $register): void
    {
        abort_unless($register->company_id === Auth::user()->company_id, 403);
        abort_unless($this->canViewAll(), 403, 'Não autorizado.');
    }
}
