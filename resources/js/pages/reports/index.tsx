import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DownloadCloud, FileText, FileSpreadsheet, Loader2, TrendingUp, Users, Package, MonitorPlay } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReportsIndex() {
    const [category, setCategory] = useState('sales');

    // Default to current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

    const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(endOfMonth.toISOString().split('T')[0]);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ category, start_date: startDate, end_date: endDate });
            const response = await fetch(`${route('reports.data')}?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            setData(result);
        } catch (error) {
            toast.error('Erro ao carregar dados do relatório.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [category, startDate, endDate]);

    const handleExportPdf = () => {
        setIsExportingPdf(true);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('reports.export.pdf');

        const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        const categoryInput = document.createElement('input');
        categoryInput.type = 'hidden';
        categoryInput.name = 'category';
        categoryInput.value = category;
        form.appendChild(categoryInput);

        const startInput = document.createElement('input');
        startInput.type = 'hidden';
        startInput.name = 'start_date';
        startInput.value = startDate;
        form.appendChild(startInput);

        const endInput = document.createElement('input');
        endInput.type = 'hidden';
        endInput.name = 'end_date';
        endInput.value = endDate;
        form.appendChild(endInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        setTimeout(() => setIsExportingPdf(false), 2000);
    };

    const handleExportExcel = () => {
        setIsExportingExcel(true);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('reports.export.excel');

        const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        const categoryInput = document.createElement('input');
        categoryInput.type = 'hidden';
        categoryInput.name = 'category';
        categoryInput.value = category;
        form.appendChild(categoryInput);

        const startInput = document.createElement('input');
        startInput.type = 'hidden';
        startInput.name = 'start_date';
        startInput.value = startDate;
        form.appendChild(startInput);

        const endInput = document.createElement('input');
        endInput.type = 'hidden';
        endInput.name = 'end_date';
        endInput.value = endDate;
        form.appendChild(endInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        setTimeout(() => setIsExportingExcel(false), 2000);
    };

    return (
        <AppLayout
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Relatórios e Estatísticas
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-md shadow-sm border dark:border-zinc-800">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-8 border-none shadow-none focus-visible:ring-0 w-36 text-sm"
                            />
                            <span className="text-muted-foreground text-sm">até</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-8 border-none shadow-none focus-visible:ring-0 w-36 text-sm"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPdf}
                            disabled={isExportingPdf || loading}
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:border-red-900/50"
                        >
                            {isExportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            disabled={isExportingExcel || loading}
                            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:border-green-900/50"
                        >
                            {isExportingExcel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                            Excel
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Relatórios" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Tabs value={category} onValueChange={setCategory} className="space-y-6">
                        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-white dark:bg-zinc-900 shadow-sm border dark:border-zinc-800 rounded-xl">
                            <TabsTrigger value="sales" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-lg py-2.5">
                                <TrendingUp className="w-4 h-4 mr-2" /> Vendas
                            </TabsTrigger>
                            <TabsTrigger value="inventory" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 rounded-lg py-2.5">
                                <Package className="w-4 h-4 mr-2" /> Inventário
                            </TabsTrigger>
                            <TabsTrigger value="customers" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 rounded-lg py-2.5">
                                <Users className="w-4 h-4 mr-2" /> Clientes
                            </TabsTrigger>
                            <TabsTrigger value="pos" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 rounded-lg py-2.5">
                                <MonitorPlay className="w-4 h-4 mr-2" /> Ponto de Venda
                            </TabsTrigger>
                        </TabsList>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                <TabsContent value="sales" className="space-y-6 animate-in fade-in-50 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-blue-600">{formatCurrency(data?.total_revenue || 0)}</div>
                                                <p className="text-xs text-muted-foreground mt-1">Faturas confirmadas e pagas</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Impostos Recolhidos</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-red-500">{formatCurrency(data?.total_taxes || 0)}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Emitidas</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{data?.total_invoices || 0}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Cotações Emitidas</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{data?.total_quotes || 0}</div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Histórico de Receitas</CardTitle>
                                            <CardDescription>Evolução diária de receitas no período selecionado</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Gráfico Placeholder - pode ser substituído por Recharts depois */}
                                            <div className="h-64 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-slate-200 dark:border-zinc-700">
                                                <p className="text-muted-foreground text-sm">Visualização de Gráfico (Requer biblioteca de gráficos)</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="inventory" className="space-y-6 animate-in fade-in-50 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Entradas (Ins)</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold text-green-600">{data?.total_ins || 0} <span className="text-base font-normal text-muted-foreground">unidades</span></div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Saídas (Outs)</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold text-orange-600">{data?.total_outs || 0} <span className="text-base font-normal text-muted-foreground">unidades</span></div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-red-600">
                                                <Package className="w-5 h-5 mr-2" />
                                                Alertas de Stock Baixo
                                            </CardTitle>
                                            <CardDescription>Produtos que atingiram ou estão abaixo do stock mínimo</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {data?.low_stock_products?.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                                            <tr>
                                                                <th className="px-4 py-3 rounded-tl-lg">Produto</th>
                                                                <th className="px-4 py-3">Referência</th>
                                                                <th className="px-4 py-3 text-right">Stock Atual</th>
                                                                <th className="px-4 py-3 text-right rounded-tr-lg">Stock Mín.</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.low_stock_products.map((product: any, idx: number) => (
                                                                <tr key={idx} className="border-b last:border-0 dark:border-zinc-800">
                                                                    <td className="px-4 py-3 font-medium">{product.name}</td>
                                                                    <td className="px-4 py-3">{product.reference || '-'}</td>
                                                                    <td className="px-4 py-3 text-right font-bold text-red-600">{product.total_stock || 0}</td>
                                                                    <td className="px-4 py-3 text-right text-muted-foreground">{product.min_stock}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    Nenhum alerta de stock baixo no momento.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="customers" className="space-y-6 animate-in fade-in-50 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Top Clientes (Receita)</CardTitle>
                                                <CardDescription>Os 10 clientes que mais gastaram no período</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {data?.top_customers?.map((tc: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                                    {i + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{tc.customer?.name || 'Cliente Desconhecido'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="font-bold">{formatCurrency(tc.total_spent)}</div>
                                                        </div>
                                                    ))}
                                                    {(!data?.top_customers || data.top_customers.length === 0) && (
                                                        <p className="text-center text-muted-foreground text-sm py-4">Nenhum dado encontrado.</p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Saldos Pendentes</CardTitle>
                                                <CardDescription>Clientes com maiores dívidas</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {data?.pending_balances?.map((pb: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                                                                    !
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{pb.customer?.name || 'Cliente Desconhecido'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="font-bold text-red-500">{formatCurrency(pb.pending_balance)}</div>
                                                        </div>
                                                    ))}
                                                    {(!data?.pending_balances || data.pending_balances.length === 0) && (
                                                        <p className="text-center text-muted-foreground text-sm py-4">Nenhum saldo pendente encontrado.</p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="pos" className="space-y-6 animate-in fade-in-50 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Turnos Registados</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{data?.total_shifts || 0}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Esperado</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-blue-600">{formatCurrency(data?.total_expected || 0)}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Reportado</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-green-600">{formatCurrency(data?.total_reported || 0)}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">Quebras de Caixa</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className={`text-2xl font-bold ${data?.total_variances < 0 ? 'text-red-500' : 'text-slate-600'}`}>
                                                    {formatCurrency(data?.total_variances || 0)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
