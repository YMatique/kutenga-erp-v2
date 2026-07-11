<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PosShift;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PosShiftController extends Controller
{
    public function index()
    {
        $user    = Auth::user();
        $company = $user->company_id;

        $shifts = PosShift::where('company_id', $company)
            ->with(['user:id,name', 'branch:id,name'])
            ->withCount('documents')
            ->withSum('documents', 'grand_total')
            ->orderBy('opened_at', 'desc')
            ->paginate(20)
            ->through(function ($shift) {
                return [
                    'id'              => $shift->id,
                    'status'          => $shift->status,
                    'operator'        => $shift->user?->name ?? '—',
                    'branch'          => $shift->branch?->name ?? '—',
                    'opened_at'       => $shift->opened_at,
                    'closed_at'       => $shift->closed_at,
                    'starting_cash'   => (float) $shift->starting_cash,
                    'ending_cash'     => $shift->ending_cash !== null ? (float) $shift->ending_cash : null,
                    'documents_count' => $shift->documents_count,
                    'sales_total'     => (float) ($shift->documents_sum_grand_total ?? 0),
                ];
            });

        $stats = [
            'total_shifts' => PosShift::where('company_id', $company)->count(),
            'open_shifts'  => PosShift::where('company_id', $company)->where('status', 'open')->count(),
            'today_sales'  => (float) DB::table('documents')
                ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
                ->where('pos_shifts.company_id', $company)
                ->whereDate('documents.created_at', today())
                ->whereNull('documents.deleted_at')
                ->sum('documents.grand_total'),
            'month_sales'  => (float) DB::table('documents')
                ->join('pos_shifts', 'documents.pos_shift_id', '=', 'pos_shifts.id')
                ->where('pos_shifts.company_id', $company)
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
        ]);
    }

    public function show(PosShift $shift)
    {
        $user = Auth::user();
        if ($shift->company_id !== $user->company_id) abort(403);

        $shift->load(['user:id,name', 'branch:id,name', 'documents.items']);

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

        $summary = [
            'total_docs'   => $documents->count(),
            'sales_total'  => $documents->sum('grand_total'),
            'tax_total'    => $documents->sum('tax_total'),
            'subtotal'     => $documents->sum('subtotal'),
            'starting_cash' => (float) $shift->starting_cash,
            'ending_cash'   => $shift->ending_cash !== null ? (float) $shift->ending_cash : null,
        ];

        return Inertia::render('pos/Shifts/Show', [
            'shift'     => [
                'id'         => $shift->id,
                'status'     => $shift->status,
                'operator'   => $shift->user?->name ?? '—',
                'branch'     => $shift->branch?->name ?? '—',
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

        return Inertia::render('pos/Shifts/Open');
    }

    public function store(Request $request)
    {
        $request->validate([
            'starting_cash' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();

        $openShift = PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->first();

        if ($openShift) {
            return redirect()->route('pos.index')->with('error', 'Já possui um turno aberto.');
        }

        PosShift::create([
            'company_id'   => $user->company_id,
            'branch_id'    => $user->branch_id ?? 1,
            'user_id'      => $user->id,
            'status'       => 'open',
            'opened_at'    => now(),
            'starting_cash' => $request->starting_cash,
        ]);

        return redirect()->route('pos.index')->with('success', 'Turno aberto com sucesso.');
    }

    public function showClose()
    {
        $user = Auth::user();

        $openShift = PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->with(['documents.items'])
            ->firstOrFail();

        $salesTotal    = (float) $openShift->documents()->sum('grand_total');
        $totalDocs     = $openShift->documents()->count();
        $expectedCash  = (float) $openShift->starting_cash + $salesTotal;

        return Inertia::render('pos/Shifts/Close', [
            'shift'        => $openShift,
            'salesTotal'   => $salesTotal,
            'totalDocs'    => $totalDocs,
            'expectedCash' => $expectedCash,
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

        $shift->update([
            'status'      => 'closed',
            'closed_at'   => now(),
            'ending_cash' => $request->ending_cash,
            'notes'       => $request->notes,
        ]);

        return redirect()->route('pos.shifts.index')->with('success', 'Turno fechado com sucesso!');
    }
}
