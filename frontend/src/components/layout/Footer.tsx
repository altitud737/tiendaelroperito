import Link from 'next/link';
import { Instagram, MessageCircle, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-blue/15 border-t border-border">
      <div className="container-roperito section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Columna 1: Marca */}
          <div>
            <h3 className="font-serif text-2xl font-bold text-text mb-3">El Roperito</h3>
            <p className="text-text-light text-sm leading-relaxed mb-4">
              Moda circular infantil. Cada prenda tiene una historia y merece una nueva familia.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/elroperito"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text hover:text-pink transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://wa.me/5492346530892"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text hover:text-pink transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Columna 2: Navegación */}
          <div>
            <h4 className="font-label text-xs uppercase tracking-widest text-text-light mb-4">Navegación</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/tienda" className="text-sm text-text hover:text-pink transition-colors">
                Tienda
              </Link>
              <Link href="/vender" className="text-sm text-text hover:text-pink transition-colors">
                Vendé tu ropa
              </Link>
              <Link href="/tienda?novedades=true" className="text-sm text-text hover:text-pink transition-colors">
                Novedades
              </Link>
              <Link href="/login" className="text-sm text-text hover:text-pink transition-colors">
                Mi cuenta
              </Link>
            </nav>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h4 className="font-label text-xs uppercase tracking-widest text-text-light mb-4">Contacto</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-text-light mt-0.5 shrink-0" />
                <p className="text-sm text-text">Av. 3 de Febrero 640, Chivilcoy, Buenos Aires</p>
              </div>
              <a
                href="https://wa.me/5492346530892"
                className="flex items-center gap-2 text-sm text-text hover:text-pink transition-colors"
              >
                <MessageCircle size={16} className="shrink-0" />
                +54 9 2346 530892
              </a>
              <a
                href="https://www.instagram.com/elroperito"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-text hover:text-pink transition-colors"
              >
                <Instagram size={16} className="shrink-0" />
                @elroperitochivilcoy
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container-roperito px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-text-light">
            © {new Date().getFullYear()} El Roperito. Todos los derechos reservados.
          </p>
          <p className="text-xs text-text-light">
            Hecho con amor en Chivilcoy 💛
          </p>
        </div>
      </div>
    </footer>
  );
}
