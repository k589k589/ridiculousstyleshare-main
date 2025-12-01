-- Delete specified outfit examples
DELETE FROM public.outfits WHERE title IN (
  'Normcore 常態核心風',
  'Soft Grunge 軟糜爛風',
  'Tomboy 中性帥氣風',
  'Clean Girl 清淡女孩風',
  'Old Money 優雅風',
  'Blokecore 英式男孩風',
  'Dopamine Dressing 多巴胺穿搭'
);