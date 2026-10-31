---
title: "Arquitectura limpia para proyectos pequeños"
slug: "arquitectura-limpia-para-proyectos-pequenos"
description: "Notas prácticas para mantener claridad técnica sin convertir un proyecto personal en una ceremonia de capas innecesarias."
type: "articulo"
stage: "perenne"
created: 2026-02-06
topics: ["programación", "arquitectura", "software", "clean-code"]
featured: true
draft: false
---

Un proyecto pequeño no necesita fingir que es una plataforma enorme. Pero sí necesita límites comprensibles.

La arquitectura limpia, en proyectos personales, funciona mejor como criterio que como plantilla. Sirve para preguntar dónde vive una responsabilidad, qué datos cruzan una frontera y qué parte del sistema debería poder cambiar sin arrastrar a todas las demás.

## El exceso también ensucia

A veces añadimos capas para sentirnos profesionales. Repositorios, servicios, adaptadores, DTOs y carpetas con nombres solemnes pueden ser útiles, pero también pueden ocultar que todavía no entendemos el problema.

La buena señal no es tener muchas piezas. Es que cada pieza tenga un motivo.

## Una regla sencilla

Si una decisión reduce confusión real, merece espacio. Si solo anticipa un futuro imaginario, probablemente puede esperar.

La elegancia técnica tiene mucho que ver con saber aplazar.
