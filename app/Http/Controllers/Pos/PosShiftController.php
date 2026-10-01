<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Pos\CashRegister;
use App\Models\Pos\PosShift;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PosShiftController extends Controller
{
    public function index()
    {
        $user    = Auth::user();
        $company = $user->company_id;

        $canViewAll = $user->hasAnyRole(['Admin', 'owner', 'Manager']);

        $shiftsQuery = PosShift::where('company_id', $company)
            ->with(['user:id,name', 'branch:id,name', 'cashRegister:id,name'])
            ->withCount(['documents' => fn ($q) => $q->where('status', '!=', 'cancelled')])
            ->withSum(['documents' => fn ($q) => $q->where('status', '!=', 'cancelled')], 'grand_total')
            ->orderBy('opened_at', 'desc');

        if (!$canViewAll) {
            $shiftsQuery->where('user_id', $user->id);
        }

        $shifts = $shiftsQuery->paginate(20)->through(function ($shift) {
            return [
                'id'              => $shift->id,
                'status'          => $shift->status,
                'operator'        => $shift->user?->name ?? '—',
                'branch'          => $shift->branch?->name ?? '—',
                'register'        => $shift->cashRegister?->name ?? '—',
                'opened_at'       => $shift->opened_at,
                'closed_at'       => $shift->closed_at,
                'starting_cash'   => (float) $shift->starting_cash,
                'ending_cash'     => $shift->ending_cash !== null ? (float) $shift->ending_cash : null,
                'cash_difference' => $shift->cash_difference !== null ? (float) $shift->cash_difference : null,
                'documents_count' => $shift->documents_count,
                'sales_total'     => (float) ($shift->documents_sum_grand_total ?? 0),
            ];
        });

        $stats = [
            'total_shifts' => PosShift::where('company_id', $company)
                ->when(!$canViewAll, fn($q) => $q->where('user_id', $user->id))
                ->count(),
            'open_shifts'  => PosShift::where('company_id', $company)
                ->when(!$canViewAll, fn($q) => $q->where('user_id', $user->id))
                ->where('status', 'open')
                ->count(),
            'today_sales'  => (float) DB::table('documents')
                ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
                ->where('pos_shifts.company_id', $company)
                ->where('documents.source_module', 'pos')
                ->where('documents.status', '!=', 'cancelled')
                ->when(!$canViewAll, fn($q) => $q->where('pos_shifts.user_id', $user->id))
                ->whereDate('documents.created_at', today())
                ->whereNull('documents.deleted_at')
                ->sum('documents.grand_total'),
            'month_sales'  => (float) DB::table('documents')
                ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
                ->where('pos_shifts.company_id', $company)
                ->where('documents.source_module', 'pos')
                ->where('documents.status', '!=', 'cancelled')
                ->when(!$canViewAll, fn($q) => $q->where('pos_shifts.user_id', $user->id))
                ->whereMonth('documents.created_at', now()->month)
                ->whereYear('documents.created_at', now()->year)
                ->whereNull('documents.deleted_at')
                ->sum('documents.grand_total'),
        ];

        $myOpenShift = PosShift::where('company_id', $company)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        return Inertia::render('pos/Shifts/History', [
            'shifts'      => $shifts,
            'stats'       => $stats,
            'myOpenShift' => $myOpenShift,
            'canViewAll'  => $canViewAll,
        ]);
    }

    public function show(PosShift $shift)
    {
        $user = Auth::user();
        if ($shift->company_id !== $user->company_id) abort(403);

        if (!$user->hasAnyRole(['Admin', 'owner', 'Manager']) && $shift->user_id !== $user->id) {
            abort(403, 'Não autorizado.');
        }

        $shift->load(['user:id,name', 'branch:id,name', 'cashRegister:id,name', 'documents.items']);

        $documents = $shift->documents->map(function ($doc) {
            return [
                'id'              => $doc->id,
                'number'          => $doc->number ?? ($doc->series?->prefix . '/' . $doc->sequence_number),
                'status'          => $doc->status,
                'subtotal'        => (float) $doc->subtotal,
                'tax_total'       => (float) $doc->tax_total,
                'grand_total'     => (float) $doc->grand_total,
                'created_at'      => $doc->created_at,
                'items_count'     => $doc->items->count(),
            ];
        });

        // Documentos cancelados continuam listados mas não contam nos totais
        $valid = $documents->where('status', '!=', 'cancelled');

        $summary = [
            'total_docs'   => $valid->count(),
            'sales_total'  => $valid->sum('grand_total'),
            'tax_total'    => $valid->sum('tax_total'),
            'subtotal'     => $valid->sum('subtotal'),
            'starting_cash' => (float) $shift->starting_cash,
            'ending_cash'   => $shift->ending_cash !== null ? (float) $shift->ending_cash : null,
            'cash_difference' => $shift->cash_difference !== null ? (float) $shift->cash_difference : null,
        ];

        return Inertia::render('pos/Shifts/Show', [
            'shift'     => [
                'id'         => $shift->id,
                'status'     => $shift->status,
                'operator'   => $shift->user?->name ?? '—',
                'branch'     => $shift->branch?->name ?? '—',
                'register'   => $shift->cashRegister?->name ?? '—',
                'opened_at'  => $shift->opened_at,
                'closed_at'  => $shift->closed_at,
                'notes'      => $shift->notes,
            ],
            'documents' => $documents,
            'summary'   => $summary,
        ]);
    }


    public function create()
    {
        $user = Auth::user();

        $openShift = PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->first();

        if ($openShift) {
            return redirect()->route('pos.index');
        }

        CashRegister::ensureDefault($user->company_id, $user->branch_id);

        $registers = CashRegister::where('company_id', $user->company_id)
            ->where('is_active', true)
            ->with('branch:id,name')
            ->orderBy('name')
            ->get()
            ->map(function ($register) {
                $open = $register->shifts()->where('status', 'open')->with('user:id,name')->first();

                return [
                    'id'      => $register->id,
                    'name'    => $register->name,
                    'branch'  => $register->branch?->name,
                    'busy_by' => $open?->user?->name,
                ];
            });

        return Inertia::render('pos/Shifts/Open', ['registers' => $registers]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'starting_cash'    => 'required|numeric|min:0',
            'cash_register_id' => 'nullable|integer',
        ]);

        $user = Auth::user();

        $openShift = PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->first();

        if ($openShift) {
            return redirect()->route('pos.index')->with('error', 'Já possui um turno aberto.');
        }

        CashRegister::ensureDefault($user->company_id, $user->branch_id);

        $registers = CashRegister::where('company_id', $user->company_id)->where('is_active', true);

        // Com uma única caixa ativa não é preciso escolher
        $register = $request->filled('cash_register_id')
            ? (clone $registers)->find($request->cash_register_id)
            : ((clone $registers)->count() === 1 ? (clone $registers)->first() : null);

        if (!$register) {
            return back()->withErrors(['cash_register_id' => 'Selecione uma caixa válida.']);
        }

        try {
            DB::transaction(function () use ($request, $user, $register) {
                // Bloqueia a caixa para evitar dois turnos abertos em simultâneo
                CashRegister::lockForUpdate()->findOrFail($register->id);

                if (PosShift::where('cash_register_id', $register->id)->where('status', 'open')->exists()) {
                    throw new \DomainException('Esta caixa já tem um turno aberto por outro operador.');
                }

                PosShift::create([
                    'company_id'       => $user->company_id,
                    'branch_id'        => $register->branch_id,
                    'cash_register_id' => $register->id,
                    'user_id'          => $user->id,
                    'status'           => 'open',
                    'opened_at'        => now(),
                    'starting_cash'    => $request->starting_cash,
                ]);
            });
        } catch (\DomainException $e) {
            return back()->withErrors(['cash_register_id' => $e->getMessage()]);
        }

        return redirect()->route('pos.index')->with('success', 'Turno aberto com sucesso.');
    }

    public function showClose()
    {
        $user = Auth::user();

        $openShift = PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->with(['cashRegister:id,name'])
            ->firstOrFail();

        $totals       = $openShift->paymentTotals();
        $salesTotal   = array_sum($totals);
        $totalDocs    = $openShift->documents()->where('status', '!=', 'cancelled')->count();
        // Só o dinheiro físico entra na caixa: cartão e transferência não
        $expectedCash = (float) $openShift->starting_cash + $totals['cash'];

        return Inertia::render('pos/Shifts/Close', [
            'shift'         => $openShift,
            'salesTotal'    => $salesTotal,
            'paymentTotals' => $totals,
            'totalDocs'     => $totalDocs,
            'expectedCash'  => $expectedCash,
        ]);
    }

    public function close(Request $request, PosShift $shift)
    {
        $request->validate([
            'ending_cash' => 'required|numeric|min:0',
            'notes'       => 'nullable|string',
        ]);

        if ($shift->user_id !== Auth::id() || $shift->status !== 'open') {
            abort(403, 'Não autorizado ou turno já fechado.');
        }

        $totals       = $shift->paymentTotals();
        $expectedCash = round((float) $shift->starting_cash + $totals['cash'], 2);

        $shift->update([
            'status'          => 'closed',
            'closed_at'       => now(),
            'ending_cash'     => $request->ending_cash,
            'expected_cash'   => $expectedCash,
            'cash_difference' => round((float) $request->ending_cash - $expectedCash, 2),
            'payment_totals'  => $totals,
            'notes'           => $request->notes,
        ]);

        return redirect()->route('pos.shifts.index')->with('success', 'Turno fechado com sucesso!');
    }
}
