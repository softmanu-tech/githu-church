#!/bin/bash

# Ultra-Fast System Optimization Script
echo "🚀 Starting Ultra-Fast System Optimization..."

# 1. Update all dashboard pages with ultra-fast skeleton loading
echo "📱 Updating dashboard pages with ultra-fast skeleton loading..."

# Bishop pages
find src/app/\(dashboard\)/bishop -name "*.tsx" -exec sed -i 's/CardSkeleton/UltraFastCardSkeleton/g' {} \;
find src/app/\(dashboard\)/bishop -name "*.tsx" -exec sed -i 's/ChartSkeleton/UltraFastChartSkeleton/g' {} \;
find src/app/\(dashboard\)/bishop -name "*.tsx" -exec sed -i 's/TableSkeleton/UltraFastTableSkeleton/g' {} \;

# Leader pages
find src/app/\(dashboard\)/leader -name "*.tsx" -exec sed -i 's/CardSkeleton/UltraFastCardSkeleton/g' {} \;
find src/app/\(dashboard\)/leader -name "*.tsx" -exec sed -i 's/ChartSkeleton/UltraFastChartSkeleton/g' {} \;
find src/app/\(dashboard\)/leader -name "*.tsx" -exec sed -i 's/TableSkeleton/UltraFastTableSkeleton/g' {} \;

# Member pages
find src/app/\(dashboard\)/member -name "*.tsx" -exec sed -i 's/CardSkeleton/UltraFastCardSkeleton/g' {} \;
find src/app/\(dashboard\)/member -name "*.tsx" -exec sed -i 's/ChartSkeleton/UltraFastChartSkeleton/g' {} \;
find src/app/\(dashboard\)/member -name "*.tsx" -exec sed -i 's/TableSkeleton/UltraFastTableSkeleton/g' {} \;

# Protocol pages
find src/app/\(dashboard\)/protocol -name "*.tsx" -exec sed -i 's/CardSkeleton/UltraFastCardSkeleton/g' {} \;
find src/app/\(dashboard\)/protocol -name "*.tsx" -exec sed -i 's/ChartSkeleton/UltraFastChartSkeleton/g' {} \;
find src/app/\(dashboard\)/protocol -name "*.tsx" -exec sed -i 's/TableSkeleton/UltraFastTableSkeleton/g' {} \;

# Visitor pages
find src/app/\(dashboard\)/visitor -name "*.tsx" -exec sed -i 's/CardSkeleton/UltraFastCardSkeleton/g' {} \;
find src/app/\(dashboard\)/visitor -name "*.tsx" -exec sed -i 's/ChartSkeleton/UltraFastChartSkeleton/g' {} \;
find src/app/\(dashboard\)/visitor -name "*.tsx" -exec sed -i 's/TableSkeleton/UltraFastTableSkeleton/g' {} \;

echo "✅ Ultra-fast skeleton loading applied to all pages!"

# 2. Remove framer-motion from all pages
echo "🗑️ Removing framer-motion from all pages..."

find src -name "*.tsx" -exec sed -i 's/import.*framer-motion.*//g' {} \;
find src -name "*.tsx" -exec sed -i 's/import.*motion.*//g' {} \;
find src -name "*.tsx" -exec sed -i 's/<motion\./</g' {} \;
find src -name "*.tsx" -exec sed -i 's/<\/motion\./</g' {} \;

echo "✅ Framer-motion removed from all pages!"

# 3. Add ultra-fast imports to all dashboard pages
echo "📦 Adding ultra-fast imports to all dashboard pages..."

find src/app/\(dashboard\) -name "*.tsx" -exec sed -i '1i import { UltraFastCardSkeleton, UltraFastChartSkeleton, UltraFastTableSkeleton, UltraFastStatsSkeleton, UltraFastPageSkeleton } from "@/components/ui/ultra-fast-skeleton"' {} \;

echo "✅ Ultra-fast imports added to all dashboard pages!"

echo "🎉 Ultra-Fast System Optimization Complete!"
echo "⚡ All pages now use ultra-fast skeleton loading!"
echo "🚀 System performance optimized for maximum speed!"
