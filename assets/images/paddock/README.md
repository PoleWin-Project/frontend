# Décors du Paddock

Deux illustrations décoratives créées avec l'outil intégré `image_gen`, puis
retravaillées en aplats 2D. Aucun texte, logo, prix ou bouton n'est dans ces images.

- `garage-box-2d.png` : box avec télémétrie, pneus slicks, armoires et pistolet de roue suspendu.
- `garage-car-2d.png` : monoplace noire et rouge vue de face, pour le bas de page.

Le logo est celui du projet (`../polewin.png`). Les casques, tenues, fonds et
cadres restent composés depuis les illustrations existantes par `PilotAvatar`.
Les titres réutilisent Montserrat Black Italic, déjà disponible dans le projet.

## Prompts de création

Box : illustration décorative de garage de Formule 1, vue frontale, noir et
anthracite avec bande rouge, éclairage au plafond, racks de pneus slicks avec
filets jaunes à gauche, armoires techniques et pistolet pneumatique rouge sur
câble spiralé à droite, établi et écrans de télémétrie au fond. Centre sombre
pour recevoir le véritable texte et l'avatar interactif. Aucun personnage,
casque, véhicule, texte, logo ou composant d'interface.

Monoplace : illustration décorative frontale et symétrique d'une monoplace
noire avec nez et aileron rouge, pneus slicks à filets jaunes, suspensions
visibles et halo. Sol anthracite et marquages rouges, garage sombre. Aucun
sponsor, texte, logo, personnage ou composant d'interface.

Prompt final de correction appliqué aux deux illustrations :

> Edit this decorative asset. Keep EXACT subject, composition and palette.
> Change rendering to STRICT flat 2D cartoon illustration for a mobile racing
> game: bold thick black ink contours, simplified flat cel shading using just
> 2-3 solid tones per object, no realistic materials, no glossy surface
> reflections, no photographic textures, no ray tracing, no smooth modeled 3D
> shading. All panels, car parts, wheels, tools drawn with hand-inked comic
> outlines. Floor is flat charcoal with simple geometric panels and red lines,
> NO reflections or grain. It should look like clean 2D vector cartoon art,
> matching simple illustrated helmet avatars, not a 3D render. Preserve all
> objects and colors. NO text or logos or UI.

## Vérification

Captures iPhone 17 Pro Max : titre entier, grille à deux colonnes, noms et prix,
filtre Casques, collection, zoom de la tenue Audi et monoplace en bas de page.
La comparaison avec la référence a conduit à corriger la hauteur de ligne des
titres, le cadrage des décors et l'alignement des prix.

L'interface se limite à 820 points sur grand écran ; sur petit écran, chaque
carte place son aperçu au-dessus du nom pour conserver deux colonnes lisibles.
Les fonctions de chargement, renouvellement hebdomadaire, achat et équipement,
ainsi que les prix et données serveur, sont conservés.
