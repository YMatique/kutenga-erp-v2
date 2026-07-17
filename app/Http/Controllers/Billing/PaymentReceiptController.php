<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;

use App\Models\Billing\PaymentReceipt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentReceiptController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $query = PaymentReceipt::where('company_id', $companyId)
            ->with(['series', 'customer'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('document_number', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%")
                      ->orWhere('customer_nuit', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                if ($status !== 'all') {
                    $query->where('status', $status);
                }
            });

        $kpis = [
            'total_count' => (clone $query)->count(),
            'total_amount' => (clone $query)->sum('grand_total'),
            'paid_amount' => (clone $query)->where('status', 'paid')->sum('grand_total'),
            'cancelled_amount' => (clone $query)->where('status', 'cancelled')->sum('grand_total'),
        ];

        $receipts = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('billing/payment-receipts/index', [
            'documents' => $receipts,
            'filters' => $request->only(['search', 'status']),
            'kpis' => $kpis,
            'type' => 'RC',
            'title' => 'Recibos de Pagamento'
        ]);
    }

    public function show(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $receipt = PaymentReceipt::where('company_id', $companyId)
            ->with(['items', 'series', 'customer'])
            ->findOrFail($id);

        return Inertia::render('billing/payment-receipts/show', [
            'document' => $receipt,
            'type' => 'RC'
        ]);
    }
}
