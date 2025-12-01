-- Delete additional specified outfit examples
DELETE FROM public.outfits WHERE title IN (
  'Dark Academia 黑暗學院風',
  'Cottagecore 田園風',
  'Acubi 韓系街頭風'
);