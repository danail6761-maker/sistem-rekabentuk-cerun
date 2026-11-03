#!/usr/bin/env python3
"""Bina aplikasi: gabungkan enjin ke dalam HTML."""
import pathlib
d = pathlib.Path(__file__).parent
app = (d/'src/app.html').read_text(encoding='utf-8')
eng = (d/'src/engine.js').read_text(encoding='utf-8')
body = app.replace('/*ENGINE*/', eng)
(d/'dist').mkdir(exist_ok=True)
(d/'dist/artifact.html').write_text(body, encoding='utf-8')
head, rest = body.split('</style>', 1)
full = ('<!doctype html>\n<html lang="ms">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + head + '</style>\n</head>\n<body>\n' + rest + '\n</body>\n</html>\n')
(d/'Sistem-Rekabentuk-Cerun.html').write_text(full, encoding='utf-8')
print('OK', len(full))
