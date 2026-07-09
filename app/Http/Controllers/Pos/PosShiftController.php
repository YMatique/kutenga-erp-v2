<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PosShift;
use Illuminate\Support\Facades\Auth;

class PosShiftController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $shifts = PosShift::where('company_id', $user->company_id)
            ->with(['user'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
            
        return Inertia::render('pos/Shifts/History', [
            'shifts' => $shifts,
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        
        // Se já tiver turno aberto, redireciona
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
        
        // Verifica se já existe turno aberto para o utilizador
        $openShift = PosShift::where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->where('status', 'open')
            ->first();
            
        if ($openShift) {
            return redirect()->route('pos.index')->with('error', 'Já possui um turno aberto.');
        }

        PosShift::create([
            'company_id' => $user->company_id,
            'branch_id' => $user->branch_id ?? 1, // fallback se não estiver num branch
            'user_id' => $user->id,
            'status' => 'open',
            'opened_at' => now(),
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
            ->with(['documents'])
            ->firstOrFail();

        // Calculate sales totals
        $salesTotal = $openShift->documents()->sum('grand_total');
        
        return Inertia::render('pos/Shifts/Close', [
            'shift' => $openShift,
            'salesTotal' => $salesTotal,
        ]);
    }

    public function close(Request $request, PosShift $shift)
    {
        $request->validate([
            'ending_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($shift->user_id !== Auth::id() || $shift->status !== 'open') {
            abort(403, 'Não autorizado ou turno já fechado.');
        }

        $shift->update([
            'status' => 'closed',
            'closed_at' => now(),
            'ending_cash' => $request->ending_cash,
            'notes' => $request->notes,
        ]);

        return redirect()->route('dashboard')->with('success', 'Turno fechado com sucesso.');
    }
}
