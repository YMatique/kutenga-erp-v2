<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Branch;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index()
    {
        return Inertia::render('branches/index', [
            'branches' => Branch::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
        ]);

        Branch::create($validated);

        return back()->with('success', 'Filial criada com sucesso.');
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code,' . $branch->id,
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
        ]);

        $branch->update($validated);

        return back()->with('success', 'Filial atualizada com sucesso.');
    }

    public function destroy(Branch $branch)
    {
        $branch->delete();
        return back()->with('success', 'Filial removida com sucesso.');
    }
}
