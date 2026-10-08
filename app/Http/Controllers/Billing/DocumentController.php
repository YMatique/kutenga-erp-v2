<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Billing\Document;
use Illuminate\Http\Request;

/**
 * Ações comuns a todos os tipos de documento (PDF e envio por e-mail). Criação, edição, emissão e
 * cancelamento vivem nos controllers de cada tipo (Invoice, Receipt, Quote, CreditNote, DebitNote...).
 */
class DocumentController extends Controller
{
    /**
     * Gera e faz o download / stream do PDF de um documento.
     */
    public function downloadPdf(Request $request, $id)
    {
        $companyId = $request->user()->company_id;

        $document = Document::where('company_id', $companyId)
            ->with(['items', 'series', 'customer', 'company', 'posShift.user', 'posShift.cashRegister', 'paymentAllocations.payment'])
            ->findOrFail($id);

        // Vendas do POS saem em formato térmico; faturas-recibo da faturação normal em A4 (?format=thermal força o talão)
        $thermal = $request->get('format') === 'thermal'
            || ($document->source_module === 'pos' && $document->document_type === 'FR' && $request->get('format') !== 'a4');

        if ($thermal) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.thermal', compact('document'));
            $itemCount = count($document->items);
            // Altura dinâmica estimada para caber todo o conteúdo do rolo térmico sem quebrar página
            $height = 250 + ($itemCount * 35) + ($document->notes ? 50 : 0);
            // 80mm ≈ 226pt, 58mm ≈ 164pt
            $widthPt = app(\App\Services\Printing\PosPrintService::class)->paperWidth($document->company, $document->posShift?->cashRegister) === 58 ? 164 : 226;
            $pdf->setPaper([0, 0, $widthPt, $height], 'portrait');
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
            // Enviar e-mail usando o SMTP da empresa se configurado
            $document->loadMissing('company');
            app(\App\Services\Mail\CompanyMailService::class)->sendViaCompany(
                $document->company,
                new \App\Mail\DocumentMail($document),
                $validated['email']
            );

            return redirect()->back()->with('success', 'Documento enfileirado para envio por e-mail com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Erro ao enviar e-mail: ' . $e->getMessage()]);
        }
    }
}
