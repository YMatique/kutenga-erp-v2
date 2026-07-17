<?php

$baseDir = __DIR__ . '/../';

$domains = [
    'Inventory' => [
        'controllers' => [
            'InventoryDashboardController.php',
            'InventoryOpeningController.php',
            'InventoryClosingController.php',
            'WarehouseController.php',
            'ProductStockController.php',
            'StockAdjustmentController.php',
            'StockMovementController.php',
            'StockTransferController.php',
        ],
        'models' => [
            'Warehouse.php',
            'ProductStock.php',
            'StockAdjustment.php',
            'StockAdjustmentItem.php',
            'StockMovement.php',
            'StockTransfer.php',
            'StockTransferItem.php',
            'InventoryClosing.php',
            'InventoryClosingItem.php',
        ]
    ],
    'Billing' => [
        'controllers' => [
            'CustomerController.php',
            'DocumentController.php',
            'DocumentSeriesController.php',
            'InvoiceController.php',
            'QuoteController.php',
            'ReceiptController.php',
            'PaymentReceiptController.php',
            'CreditNoteController.php',
            'DebitNoteController.php',
        ],
        'models' => [
            'Customer.php',
            'CustomerAddress.php',
            'CustomerContact.php',
            'Document.php',
            'DocumentItem.php',
            'DocumentSeries.php',
            'Invoice.php',
            'Quote.php',
            'Receipt.php',
            'PaymentReceipt.php',
            'CreditNote.php',
            'DebitNote.php',
            'DeliveryNote.php',
            'Payment.php',
            'PaymentAllocation.php',
        ]
    ],
    'Catalog' => [
        'controllers' => [
            'BranchController.php',
            'BrandController.php',
            'CategoryController.php',
            'ProductController.php',
            'UnitController.php',
        ],
        'models' => [
            'Branch.php',
            'Brand.php',
            'Category.php',
            'Product.php',
            'Unit.php',
        ]
    ],
    'Pos' => [
        'controllers' => [], // Already in Pos/
        'models' => [
            'PosShift.php',
        ]
    ]
];

$replacements = [];

// Move files and build replacements
foreach ($domains as $domain => $data) {
    // Models
    $modelDir = $baseDir . 'app/Models/' . $domain;
    if (!is_dir($modelDir)) mkdir($modelDir, 0777, true);
    
    foreach ($data['models'] as $file) {
        $source = $baseDir . 'app/Models/' . $file;
        $dest = $modelDir . '/' . $file;
        
        if (file_exists($source)) {
            rename($source, $dest);
            $className = str_replace('.php', '', $file);
            
            // Register for global replace
            $replacements["App\\Models\\$className"] = "App\\Models\\$domain\\$className";
            
            // Update namespace in the file
            $content = file_get_contents($dest);
            $content = preg_replace('/namespace App\\\\Models;/', "namespace App\\Models\\$domain;", $content);
            file_put_contents($dest, $content);
            echo "Moved model $file to $domain\n";
        }
    }
    
    // Controllers
    $controllerDir = $baseDir . 'app/Http/Controllers/' . $domain;
    if (!is_dir($controllerDir)) mkdir($controllerDir, 0777, true);
    
    foreach ($data['controllers'] as $file) {
        $source = $baseDir . 'app/Http/Controllers/' . $file;
        $dest = $controllerDir . '/' . $file;
        
        if (file_exists($source)) {
            rename($source, $dest);
            $className = str_replace('.php', '', $file);
            
            // Register for global replace
            $replacements["App\\Http\\Controllers\\$className"] = "App\\Http\\Controllers\\$domain\\$className";
            
            // Update namespace in the file
            $content = file_get_contents($dest);
            $content = preg_replace('/namespace App\\\\Http\\\\Controllers;/', "namespace App\\Http\\Controllers\\$domain;", $content);
            file_put_contents($dest, $content);
            echo "Moved controller $file to $domain\n";
        }
    }
}

// Global Replace Function
function replaceInDir($dir, $replacements) {
    if (!is_dir($dir)) return;
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($files as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $path = $file->getRealPath();
            $content = file_get_contents($path);
            $newContent = $content;
            
            foreach ($replacements as $old => $new) {
                // We need to replace use statements
                // e.use App\Models\Product; -> use App\Models\Catalog\Product;
                $newContent = str_replace("use $old;", "use $new;", $newContent);
                // Also docblocks or inline full namespace usages
                $newContent = str_replace("\\$old", "\\$new", $newContent);
                
                // For models used without import but fully qualified
                $newContent = str_replace("$old::", "$new::", $newContent);
            }
            
            if ($newContent !== $content) {
                file_put_contents($path, $newContent);
                echo "Updated imports in $path\n";
            }
        }
    }
}

echo "Starting global replacements...\n";
replaceInDir($baseDir . 'app', $replacements);
replaceInDir($baseDir . 'routes', $replacements);
replaceInDir($baseDir . 'database', $replacements);
replaceInDir($baseDir . 'tests', $replacements);
replaceInDir($baseDir . 'resources/views', $replacements);

echo "Refactoring complete.\n";

