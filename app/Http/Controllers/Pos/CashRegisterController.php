<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Branch;
use App\Models\Inventory\Warehouse;
use App\Models\Pos\CashRegister;
use App\Support\PrinterHost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CashRegisterController extends Controller
{
    private function authorizeManage(): int
    {
        $user = Auth::user();
        abort_unless($user->hasAnyRole(['Admin', 'owner', 'Manager']), 403, 'Não autorizado.');

        return $user->company_id;
    }

    public function index()
    {
        $companyId = $this->authorizeManage();

        $registers = CashRegister::where('company_id', $companyId)
            ->with(['branch:id,name', 'warehouse:id,name', 'series:id,code,year'])
            ->orderBy('name')
            ->get()
            ->map(fn ($r) => [
                'id'           => $r->id,
                'name'         => $r->name,
                'is_active'    => $r->is_active,
                'branch_id'    => $r->branch_id,
                'branch'       => $r->branch?->name,
                'warehouse_id' => $r->warehouse_id,
                'warehouse'    => $r->warehouse?->name,
                'series'       => $r->series ? "{$r->series->code}/{$r->series->year}" : null,
                'printer_driver' => $r->printer_driver,
                'printer_name' => $r->printer_name,
                'printer_host' => $r->printer_host,
                'printer_port' => $r->printer_port,
                'paper_width'  => $r->paper_width,
                'open_drawer'  => $r->open_drawer,
                'auto_print'   => $r->auto_print,
                'is_open'      => $r->shifts()->where('status', 'open')->exists(),
            ]);

        return Inertia::render('pos/Registers/Index', [
            'registers'  => $registers,
            'branches'   => Branch::where('company_id', $companyId)->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::where('company_id', $companyId)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    private function rules(int $companyId): array
    {
        return [
            'name'         => 'required|string|max:100',
            'branch_id'    => ['required', Rule::exists('branches', 'id')->where('company_id', $companyId)],
            'warehouse_id' => ['nullable', Rule::exists('warehouses', 'id')->where('company_id', $companyId)],
            'is_active'    => 'boolean',
            'printer_driver' => ['required', Rule::in(CashRegister::PRINTER_DRIVERS)],
            'printer_name' => 'nullable|required_if:printer_driver,qz|string|max:255',
            'printer_host' => ['nullable', 'required_if:printer_driver,network', 'string', 'max:255', new PrinterHost],
            'printer_port' => ['nullable', 'integer', Rule::in(config('pos.printer_ports'))],
            'paper_width'  => 'nullable|integer|in:58,80',
            'open_drawer'  => 'boolean',
            'auto_print'   => 'boolean',
        ];
    }

    public function store(Request $request)
    {
        $companyId = $this->authorizeManage();
        $validated = $request->validate($this->rules($companyId));
        $validated['printer_port'] = $validated['printer_port'] ?? 9100;

        CashRegister::create($validated + ['company_id' => $companyId]);

        return back()->with('success', 'Caixa criada com sucesso.');
    }

    public function update(Request $request, CashRegister $register)
    {
        $companyId = $this->authorizeManage();
        abort_unless($register->company_id === $companyId, 403);

        $validated = $request->validate($this->rules($companyId));
        $validated['printer_port'] = $validated['printer_port'] ?? 9100;

        if (($validated['is_active'] ?? true) === false && $register->openShift()) {
            return back()->with('error', 'Não é possível desativar uma caixa com turno aberto.');
        }

        $register->update($validated);

        return back()->with('success', 'Caixa atualizada com sucesso.');
    }

    public function destroy(CashRegister $register)
    {
        $companyId = $this->authorizeManage();
        abort_unless($register->company_id === $companyId, 403);

        if ($register->openShift()) {
            return back()->with('error', 'Não é possível remover uma caixa com turno aberto.');
        }

        $register->delete();

        return back()->with('success', 'Caixa removida com sucesso.');
    }
}
