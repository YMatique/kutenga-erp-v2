<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ContextController extends Controller
{
    public function switch(Request $request)
    {
        $request->validate([
            'company_id' => 'sometimes|exists:companies,id',
            'branch_id' => 'sometimes|exists:branches,id',
        ]);

        if ($request->has('company_id')) {
            session(['current_company_id' => $request->company_id]);
        }

        if ($request->has('branch_id')) {
            session(['current_branch_id' => $request->branch_id]);
        }

        return back()->with('success', 'Contexto alterado com sucesso.');
    }
}
