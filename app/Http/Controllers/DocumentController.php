<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Document;
use App\Models\DocumentSeries;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\Billing\BillingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    /**
     * Lista todos os documentos emitidos com paginação e filtros.
     */
    public function index(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        $documents = Document::where('company_id', $companyId)
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
            })
            ->when($request->type, function ($query, $type) {
                if ($type !== 'all') {
                    $query->where('document_type', $type);
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('billing/documents/index', [
            'documents' => $documents,
            'filters' => $request->only(['search', 'status', 'type'])
        ]);
    }

    /**
     * Renderiza a vista de criação de nova fatura/documento.
     */
    public function create(Request $request): Response
    {
        $companyId = $request->user()->company_id;

        // Dados necessários para popular os seletores do frontend
        $customers = Customer::where('company_id', $companyId)->where('is_active', true)->get();

        $products = Product::where('company_id', $companyId)
            ->where('status', 'active')
            ->get(['id', 'name', 'sku', 'barcode', 'price', 'tax_rate', 'tax_is_exempt', 'tax_exemption_reason']);

        $series = DocumentSeries::where('company_id', $companyId)->where('is_active', true)->get();
        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/documents/create', [
            'customers' => $customers,
            'products' => $products,
            'series' => $series,
            'warehouses' => $warehouses
        ]);
    }

    /**
     * Grava um novo rascunho de documento na base de dados.
     */
    public function store(Request $request)
    {
        $companyId = $request->user()->company_id;

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'required|string|max:255',
            'customer_nuit' => 'required|string|max:15',
            'customer_phone' => 'nullable|string|max:30',
            'customer_email' => 'nullable|email|max:255',
            'customer_address' => 'nullable|string',
            'document_type' => 'required|in:FT,FR,CT,NC,ND,GR',
            'series_id' => 'nullable|exists:document_series,id',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.product_sku' => 'nullable|string|max:50',
            'items.*.product_barcode' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|between:0,100',
        ]);

        $document = $this->billingService->createDraft($validated, $companyId);

        return redirect()->route('documents.show', $document->id)
            ->with('success', 'Rascunho de documento criado com sucesso!');
    }

    /**
     * Exibe a vista de detalhe de um documento específico.
     */
    public function show(Request $request, $id): Response
    {
        $companyId = $request->user()->company_id;

        $document = Document::where('company_id', $companyId)
            ->with(['items', 'series', 'customer', 'company'])
            ->findOrFail($id);

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get();

        return Inertia::render('billing/documents/show', [
            'document' => $document,
            'warehouses' => $warehouses
        ]);
    }

    /**
     * Confirma oficialmente um documento (Emissão Fiscal) e efetua a baixa física de stock.
     */
    public function confirm(Request $request, $id)
    {
        $companyId = $request->user()->company_id;
        $document = Document::where('company_id', $companyId)->findOrFail($id);

        $hasPhysicalProducts = $document->has_physical_products;

        $validated = $request->validate([
            'warehouse_id' => $hasPhysicalProducts ? 'required|exists:warehouses,id' : 'nullable|exists:warehouses,id',
        ]);

        try {
            $warehouse = null;
            if (!empty($validated['warehouse_id'])) {
                $warehouse = Warehouse::where('company_id', $companyId)->findOrFail($validated['warehouse_id']);
            }
            $this->billingService->confirmAndEmit($document->id, $warehouse);

            return redirect()->back()->with('success', 'Documento emitido oficialmente e stock atualizado!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Regista um pagamento manual contra faturas de crédito (Amortização).
     */
    public function receivePayment(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'reference' => 'nullable|string|max:100'
        ]);

        try {
            $this->billingService->registerPayment(
                $validated['customer_id'],
                $validated['amount'],
                $validated['payment_method'],
                $validated['reference']
            );

            return redirect()->back()->with('success', 'Pagamento processado e faturas amortizadas!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Gera e faz o download / stream do PDF de um documento.
     */
    public function downloadPdf(Request $request, $id)
    {
        $companyId = $request->user()->company_id;

        $document = Document::where('company_id', $companyId)
            ->with(['items', 'series', 'customer', 'company'])
            ->findOrFail($id);

        // Se for Fatura-Recibo (FR), usar formato de impressora térmica (80mm = ~226pt)
        if ($document->document_type === 'FR' && $request->get('format') !== 'a4') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.thermal', compact('document'));
            $itemCount = count($document->items);
            // Altura dinâmica estimada para caber todo o conteúdo do rolo térmico sem quebrar página
            $height = 250 + ($itemCount * 35) + ($document->notes ? 50 : 0);
            $pdf->setPaper([0, 0, 226, $height], 'portrait');
        } else {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.document', compact('document'));
            // Configurar folha A4 e margens padrão
            $pdf->setPaper('a4', 'portrait');
        }

        // Formata o nome do arquivo, ex: FT_2026_0012.pdf
        $name = $document->document_number ?: "{$document->document_type}_draft_{$document->id}";
        $filename = str_replace(['/', ' '], '_', $name) . '.pdf';

        return $pdf->stream($filename);
    }

    /**
     * Envia o documento em anexo por e-mail para o destinatário informado.
     */
    public function sendEmail(Request $request, $id)
    {
        $companyId = $request->user()->company_id;

        $document = Document::where('company_id', $companyId)
            ->with(['items', 'series', 'customer', 'company'])
            ->findOrFail($id);

        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ]);

        try {
            // Enviar e-mail em segundo plano (enfileirado automaticamente devido ao ShouldQueue)
            \Illuminate\Support\Facades\Mail::to($validated['email'])->send(new \App\Mail\DocumentMail($document));

            return redirect()->back()->with('success', 'Documento enfileirado para envio por e-mail com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Erro ao enviar e-mail: ' . $e->getMessage()]);
        }
    }
}
