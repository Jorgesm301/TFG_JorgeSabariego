<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

# Backend - Polideportivo Municipal (TFG)

Sistema de gestión de reservas deportivas con sistema de ranking ERO.

## Instalación

1. Instalar dependencias:
```bash
composer install
```

2. Configurar archivo `.env`:
```bash
cp .env.example .env
php artisan key:generate
```

3. Configurar base de datos en `.env` y ejecutar migraciones:
```bash
php artisan migrate --seed
```

4. **IMPORTANTE**: Iniciar el scheduler de Laravel para procesamiento automático de partidos:
```bash
php artisan schedule:work
```

Este comando debe ejecutarse en segundo plano para que el sistema procese automáticamente los partidos vencidos sin resultado (aplicando 0-0 después de 24 horas).

### Alternativa: Configurar Cron (Linux/Mac)
```bash
* * * * * cd /ruta/al/proyecto/backend && php artisan schedule:run >> /dev/null 2>&1
```

### Alternativa: Task Scheduler (Windows)
Crear tarea programada que ejecute cada minuto:
```bash
cd C:\ruta\al\proyecto\backend && php artisan schedule:run
```

## Comandos útiles

- **Procesar partidos vencidos manualmente**:
```bash
php artisan partidos:procesar-vencidos
```

- **Ver rutas disponibles**:
```bash
php artisan route:list
```

- **Limpiar caché**:
```bash
php artisan cache:clear
php artisan config:clear
```

## Características

- Sistema de autenticación con Laravel Sanctum
- Gestión de reservas deportivas
- Sistema de ranking ERO (similar a ELO)
- Búsqueda de partidos por ubicación y radio GPS
- Procesamiento automático de partidos vencidos
- Sistema de equipos equilibrados
- Mensajería entre usuarios
- Sistema de amistad

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
