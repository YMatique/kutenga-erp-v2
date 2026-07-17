<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Billing\DocumentSeries;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Response;

class DocumentSeriesController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $series = DocumentSeries::where('company_id', $companyId)
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->orderBy('year', 'desc')
            ->orderBy('code', 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('billing/series/index', [
            'series' => $series,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:document_series,code,NULL,id,company_id,' . $companyId,
            'name' => 'required|string|max:255',
            'year' => 'required|integer|min:2000|max:2099',
            'is_active' => 'required|boolean',
        ]);

        $series = DocumentSeries::create([
            'company_id' => $companyId,
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'year' => $validated['year'],
            'next_number' => 1,
            'is_active' => $validated['is_active'],
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('billing.series.index')
            ->with('success', 'Série criada com sucesso!');
    }

    public function update(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $series = DocumentSeries::where('company_id', $companyId)->findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:document_series,code,' . $series->id . ',id,company_id,' . $companyId,
            'name' => 'required|string|max:255',
            'year' => 'required|integer|min:2000|max:2099',
            'is_active' => 'required|boolean',
        ]);

        $series->update($validated);

        return redirect()->route('billing.series.index')
            ->with('success', 'Série atualizada com sucesso!');
    }

    public function destroy(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $series = DocumentSeries::where('company_id', $companyId)->findOrFail($id);

        // Verificar se já existem documentos associados
        if ($series->documents()->count() > 0) {
            return redirect()->back()->withErrors([
                'error' => 'Não é possível eliminar esta série pois já existem documentos emitidos com ela.'
            ]);
        }

        $series->delete();

        return redirect()->back()->with('success', 'Série removida com sucesso!');
    }
}
