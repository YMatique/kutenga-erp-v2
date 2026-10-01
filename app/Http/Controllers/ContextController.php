<?php

namespace App\Http\Controllers;

use App\Models\Catalog\Branch;
use Illuminate\Http\Request;

/**
 * Cada utilizador pertence a uma única empresa: só é possível mudar de filial,
 * e apenas para filiais da própria empresa.
 */
class ContextController extends Controller
{
    public function switch(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer',
        ]);

        $user = $request->user();

        $branch = Branch::withoutGlobalScopes()
            ->where('company_id', $user->company_id)
            ->find($validated['branch_id']);

        abort_unless($branch, 403, 'Filial inválida.');

        session(['current_branch_id' => $branch->id]);

        return back()->with('success', 'Filial alterada com sucesso.');
    }
}
