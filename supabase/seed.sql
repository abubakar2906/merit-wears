-- Merit Luxury Wears Limited — sample product seed.
-- Run AFTER schema.sql. Safe to re-run (uses ON CONFLICT on name).

create unique index if not exists products_name_key on public.products (name);

insert into public.products (name, description, price, category, image_urls, sizes, stock_quantity, is_featured) values
-- Native attires (kaftans / agbada)
('Sterling Navy Kaftan',
 'Hand-tailored agbada in midnight wool-blend. Sterling-thread embroidery at the placket and cuffs. Cut for a relaxed, columnar silhouette.',
 285000, 'native',
 array['https://images.unsplash.com/photo-1622519407650-3df9883f76a5?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80'],
 array['S','M','L','XL','XXL'], 12, true),

('Onyx Ceremonial Agbada',
 'Three-piece ensemble — flowing outer robe, fitted inner sokoto, and cap. Onyx-black aso-oke with tonal silver thread.',
 420000, 'native',
 array['https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&w=1200&q=80'],
 array['M','L','XL','XXL'], 6, true),

('Marina Linen Kaftan',
 'Lightweight Italian linen, dyed in atelier indigo. An everyday silhouette for the modern wardrobe.',
 165000, 'native',
 array['https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80'],
 array['S','M','L','XL'], 18, false),

('House Tunic — Ivory',
 'Minimalist tunic-cut kaftan in ivory cotton-silk, finished with a single navy contrast pleat at the hem.',
 145000, 'native',
 array['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80'],
 array['S','M','L','XL'], 10, false),

-- Footwear
('Atelier Oxford — Midnight',
 'Whole-cut Oxford in mirror-polished navy calfskin. Hand-lasted in our atelier over a week of dedicated craftsmanship.',
 220000, 'shoes',
 array['https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1582897085656-c636d006a246?auto=format&fit=crop&w=1200&q=80'],
 array['41','42','43','44','45'], 8, true),

('Heritage Loafer — Sable',
 'Penny-strap loafer in burnished sable leather. Blake-stitched, leather sole.',
 185000, 'shoes',
 array['https://images.unsplash.com/photo-1582897085656-c636d006a246?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1200&q=80'],
 array['40','41','42','43','44','45'], 14, false),

('Court Sneaker — Bone',
 'Low-profile court sneaker in full-grain bone leather. Italian construction.',
 145000, 'shoes',
 array['https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80'],
 array['40','41','42','43','44','45'], 22, false),

-- Watches
('Sterling Chronograph 41',
 'Automatic chronograph, 41mm. Sapphire crystal, sterling-applied indices, navy lacquer dial.',
 980000, 'watches',
 array['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=80'],
 array['41mm'], 3, true),

('Atelier Dress Watch — Onyx',
 'Slim 38mm dress piece. Hand-finished case, alligator strap. Quiet, considered, eternal.',
 640000, 'watches',
 array['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80'],
 array['38mm'], 5, false),

('Heritage GMT — Steel',
 'Two-tone GMT with brushed steel bracelet. A traveller''s piece with restraint.',
 720000, 'watches',
 array['https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'],
 array['40mm'], 4, false),

-- Accessories
('Editor''s Sunglasses',
 'Acetate frame, hand-polished, with custom navy gradient lenses. Italian-made.',
 95000, 'accessories',
 array['https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=1200&q=80'],
 array['One Size'], 16, true),

('Sterling Bifold Wallet',
 'Bridle leather bifold, edge-painted by hand. Six card slots and twin note compartments.',
 78000, 'accessories',
 array['https://images.unsplash.com/photo-1601762603339-fd61e28b698a?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1622445275576-721325763afe?auto=format&fit=crop&w=1200&q=80'],
 array['One Size'], 24, false),

('House Cufflinks — Silver',
 'Solid sterling silver cufflinks engraved with the Merit crest. Presented in a navy cloth pouch.',
 65000, 'accessories',
 array['https://images.unsplash.com/photo-1622445275576-721325763afe?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80'],
 array['One Size'], 30, false),

('Bridle Belt — Onyx',
 '1.25" bridle leather belt with brushed-steel buckle. Built for a lifetime.',
 58000, 'accessories',
 array['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=1200&q=80',
       'https://images.unsplash.com/photo-1601762603339-fd61e28b698a?auto=format&fit=crop&w=1200&q=80'],
 array['32','34','36','38','40'], 20, false)

on conflict (name) do nothing;
