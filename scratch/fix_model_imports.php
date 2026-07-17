<?php

$baseDir = __DIR__ . '/../app/';

$models = [
    'Warehouse' => 'App\Models\Inventory\Warehouse',
    'ProductStock' => 'App\Models\Inventory\ProductStock',
    'StockAdjustment' => 'App\Models\Inventory\StockAdjustment',
    'StockAdjustmentItem' => 'App\Models\Inventory\StockAdjustmentItem',
    'StockMovement' => 'App\Models\Inventory\StockMovement',
    'StockTransfer' => 'App\Models\Inventory\StockTransfer',
    'StockTransferItem' => 'App\Models\Inventory\StockTransferItem',
    'InventoryClosing' => 'App\Models\Inventory\InventoryClosing',
    'InventoryClosingItem' => 'App\Models\Inventory\InventoryClosingItem',
    'Customer' => 'App\Models\Billing\Customer',
    'CustomerAddress' => 'App\Models\Billing\CustomerAddress',
    'CustomerContact' => 'App\Models\Billing\CustomerContact',
    'Document' => 'App\Models\Billing\Document',
    'DocumentItem' => 'App\Models\Billing\DocumentItem',
    'DocumentSeries' => 'App\Models\Billing\DocumentSeries',
    'Invoice' => 'App\Models\Billing\Invoice',
    'Quote' => 'App\Models\Billing\Quote',
    'Receipt' => 'App\Models\Billing\Receipt',
    'PaymentReceipt' => 'App\Models\Billing\PaymentReceipt',
    'CreditNote' => 'App\Models\Billing\CreditNote',
    'DebitNote' => 'App\Models\Billing\DebitNote',
    'DeliveryNote' => 'App\Models\Billing\DeliveryNote',
    'Payment' => 'App\Models\Billing\Payment',
    'PaymentAllocation' => 'App\Models\Billing\PaymentAllocation',
    'Branch' => 'App\Models\Catalog\Branch',
    'Brand' => 'App\Models\Catalog\Brand',
    'Category' => 'App\Models\Catalog\Category',
    'Product' => 'App\Models\Catalog\Product',
    'Unit' => 'App\Models\Catalog\Unit',
    'PosShift' => 'App\Models\Pos\PosShift',
    'User' => 'App\Models\User',
    'Company' => 'App\Models\Company',
    'SystemNotification' => 'App\Models\SystemNotification',
    'Activity' => 'App\Models\Activity'
];

function checkAndInjectImports($dir, $models) {
    if (!is_dir($dir)) return;
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($files as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $path = $file->getRealPath();
            $content = file_get_contents($path);
            $newContent = $content;
            
            // Determine file namespace
            $fileNamespace = '';
            if (preg_match('/namespace\s+([^;]+);/', $content, $matches)) {
                $fileNamespace = trim($matches[1]);
            }
            
            $importsToAdd = [];
            
            foreach ($models as $modelName => $fullNamespace) {
                // If the model is in the same namespace as the file, no need to import
                $modelNamespace = substr($fullNamespace, 0, strrpos($fullNamespace, '\\'));
                if ($modelNamespace === $fileNamespace) continue;
                
                // If it's already fully qualified used like App\Models\Catalog\Product, ignore
                // If it's already imported, ignore
                if (strpos($content, "use $fullNamespace;") !== false) continue;
                
                // If there's an alias or something, ignore
                if (preg_match("/use\s+.*as\s+$modelName;/", $content)) continue;
                
                // Check if the word is used in a context that looks like a class reference:
                // e.g. Product::, new Product, Product $, @var Product, @param Product, return Product, extends Product, implements, instanceof Product, (Product), belongsTo(Product::class)
                // We'll use a regex that matches $modelName not preceded by $ or -> or \ or /
                // and not followed by a quote or something if we can. Actually a simple word boundary is fine, but can cause false positives in comments.
                // False positives in imports are mostly harmless in PHP.
                
                if (preg_match("/(?<![\$\\\>a-zA-Z0-9_])" . $modelName . "\b(?!\s*\\\\)/", $content)) {
                    // Check if it's not part of an existing import like `use App\Models\Product;`
                    // Oh wait, `use App\Models\Product;` is already replaced.
                    // Let's just inject the import.
                    $importsToAdd[] = "use $fullNamespace;";
                }
            }
            
            if (!empty($importsToAdd)) {
                $importsToAdd = array_unique($importsToAdd);
                $importString = implode("\n", $importsToAdd) . "\n";
                
                // Inject after the namespace
                if (preg_match('/(namespace\s+[^;]+;)/', $newContent)) {
                    $newContent = preg_replace(
                        '/(namespace\s+[^;]+;)/', 
                        "$1\n\n$importString", 
                        $newContent, 
                        1
                    );
                } else {
                    $newContent = "<?php\n\n" . $importString . preg_replace('/<\?php\s*/', '', $newContent);
                }
                
                if ($newContent !== $content) {
                    file_put_contents($path, $newContent);
                    echo "Injected missing imports in $path\n";
                }
            }
        }
    }
}

checkAndInjectImports($baseDir . 'Models', $models);
checkAndInjectImports($baseDir . 'Http/Controllers', $models);
checkAndInjectImports($baseDir . 'Services', $models);

echo "Missing imports injected successfully.\n";
