<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;

use App\Models\Catalog\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index()
    {
        return Inertia::render('units/index', [
            'units' => Unit::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:10',
        ]);

        Unit::create($validated);

        return back()->with('success', 'Unidade de medida criada com sucesso.');
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:10',
        ]);

        $unit->update($validated);

        return back()->with('success', 'Unidade atualizada com sucesso.');
    }

    public function destroy(Unit $unit)
    {
        $unit->delete();
        return back()->with('success', 'Unidade removida com sucesso.');
    }
}
