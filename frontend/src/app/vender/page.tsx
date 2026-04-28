'use client';

import { MessageCircle, Shirt, Search, Bell, DollarSign, CheckCircle } from 'lucide-react';

export default function VenderPage() {
  const whatsappMsg = encodeURIComponent('Hola, quiero Vendé tu ropa en El Roperito 👋');

  return (
    <>
      {/* Hero */}
      <section className="section-padding bg-blue/15">
        <div className="container-roperito text-center max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-text leading-tight mb-4">
            Vendé la ropa que ya no usan
          </h1>
          <p className="font-sans text-text-light text-lg mb-8">
            Dale una nueva historia a las prendas de tus hijos y recibí crédito o efectivo
          </p>
          <a
            href={`https://wa.me/5492346530892?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 text-lg"
          >
            <MessageCircle size={20} />
            Escribinos por WhatsApp
          </a>
        </div>
      </section>

      {/* ¿Qué aceptamos? */}
      <section className="section-padding">
        <div className="container-roperito max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-text text-center mb-8">
            ¿Qué aceptamos?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { text: 'Ropa de 0 a 12 años', ok: true },
              { text: 'Limpia y en buen estado', ok: true },
              { text: 'Sin roturas ni manchas', ok: true },
              { text: 'Cremalleras y botones funcionando', ok: true },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 bg-green-50 rounded-card p-4"
              >
                <CheckCircle size={20} className="text-green-600 shrink-0" />
                <span className="font-sans text-sm text-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Cómo funciona? */}
      <section className="section-padding bg-yellow/20">
        <div className="container-roperito max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-text text-center mb-10">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: MessageCircle, step: '1', title: 'Coordinás entrega', desc: 'Nos escribís por WhatsApp y acordamos cuándo traer la ropa.' },
              { icon: Search, step: '2', title: 'Revisamos', desc: 'Seleccionamos las prendas en buen estado y las preparamos.' },
              { icon: Bell, step: '3', title: 'Te avisamos', desc: 'Te informamos qué prendas aceptamos y cuánto te corresponde.' },
              { icon: DollarSign, step: '4', title: 'Cobrás', desc: 'Elegís recibir crédito para la tienda o efectivo en el local.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-soft">
                  <item.icon size={24} className="text-pink" />
                </div>
                <span className="font-label text-xs uppercase tracking-widest text-text-light">Paso {item.step}</span>
                <h3 className="font-serif text-lg font-bold text-text mt-1 mb-2">{item.title}</h3>
                <p className="font-sans text-sm text-text-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Qué recibís? */}
      <section className="section-padding">
        <div className="container-roperito max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-text text-center mb-8">
            ¿Qué recibís?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opción Crédito */}
            <div className="bg-pink/10 rounded-card p-6 border-2 border-pink">
              <div className="flex items-center gap-2 mb-3">
                <Shirt size={20} className="text-pink" />
                <h3 className="font-serif text-xl font-bold text-text">Crédito en tienda</h3>
              </div>
              <p className="font-sans text-sm text-text-light mb-2">
                Acumulás saldo para comprar otras prendas en El Roperito. Esta opción tiene <strong className="text-text">más valor</strong> que el efectivo.
              </p>
              <span className="font-label text-xs uppercase tracking-widest text-pink font-semibold">Recomendado</span>
            </div>

            {/* Opción Efectivo */}
            <div className="bg-gray-50 rounded-card p-6 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={20} className="text-text-light" />
                <h3 className="font-serif text-xl font-bold text-text">Efectivo en local</h3>
              </div>
              <p className="font-sans text-sm text-text-light">
                Retirás el dinero directamente en nuestro local de Av. 3 de Febrero 640, Chivilcoy.
              </p>
            </div>
          </div>
          <p className="font-sans text-xs text-text-light text-center mt-6">
            El porcentaje que te corresponde se informa al momento de la recepción de las prendas.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="section-padding bg-pink">
        <div className="container-roperito text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-white mb-4">
            ¿Lista para darle una nueva vida a esa ropa?
          </h2>
          <a
            href={`https://wa.me/5492346530892?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-white inline-flex items-center gap-2 text-lg"
          >
            <MessageCircle size={20} />
            Contactanos por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
