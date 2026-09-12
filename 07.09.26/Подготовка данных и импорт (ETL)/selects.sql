SELECT 'sales' AS table_name, COUNT(*) AS row_count FROM public.sales
UNION ALL
SELECT 'partners', COUNT(*) FROM public.partners
UNION ALL
SELECT 'products', COUNT(*) FROM public.products;