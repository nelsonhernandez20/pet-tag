import Link from 'next/link'
import Image from 'next/image'
import { FaDog, FaCat, FaQrcode, FaShieldAlt, FaPhoneAlt, FaMapMarkerAlt, FaHeart, FaCheckCircle } from 'react-icons/fa'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#4646FA] via-[#4646FA] to-[#3535E8] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                🐾 La Seguridad de tu Mascota, a un Escaneo de Distancia!
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
                Sistema de identificación inteligente con código QR que conecta a tu mascota contigo, 
                permitiendo que cualquier persona pueda contactarte si la encuentra.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/login"
                  className="flex h-14 items-center justify-center gap-2 rounded-full bg-[#F4AA44] px-8 text-white transition-all duration-300 hover:bg-[#E89A2E] hover:shadow-xl hover:-translate-y-1 font-semibold text-lg shadow-lg"
                >
                  <FaHeart className="text-lg" />
                  Empezar Ahora
                </Link>
                <Link
                  href="/generate-qr"
                  className="flex h-14 items-center justify-center gap-2 rounded-full border-2 border-white bg-transparent text-white px-8 transition-all duration-300 hover:bg-white hover:text-[#4646FA] hover:shadow-xl hover:-translate-y-1 font-semibold text-lg"
                >
                  <FaQrcode className="text-lg" />
                  Generar QR
                </Link>
              </div>
            </div>
            <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/perros-grupo.jpg"
                alt="Mascotas felices"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Qué Hacemos / A qué nos dedicamos */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
              ¿A Qué Nos Dedicamos?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Somos una plataforma especializada en la protección y recuperación de mascotas 
              mediante tecnología de identificación digital accesible para todos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/gato.jpg"
                alt="Gato con identificación"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-6 text-[#4646FA]">
                Protección Inteligente para Mascotas
              </h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Nos dedicamos a proporcionar soluciones tecnológicas que garanticen la seguridad 
                de tus mascotas. Cada collar con código QR es una red de seguridad que conecta 
                a tu mascota contigo, sin importar dónde se encuentre.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-[#F4AA44] text-2xl mt-1 shrink-0" />
                  <span className="text-gray-700">Sistema de identificación único para cada mascota</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-[#F4AA44] text-2xl mt-1 shrink-0" />
                  <span className="text-gray-700">Recuperación rápida mediante tecnología QR accesible</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-[#F4AA44] text-2xl mt-1 shrink-0" />
                  <span className="text-gray-700">Privacidad y control total sobre la información compartida</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Podemos Ayudar */}
      <section className="py-20 px-4 bg-[#F3F3F3]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
              ¿Cómo Podemos Ayudarte?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nuestro sistema está diseñado para darte tranquilidad y seguridad, 
              conectando a tu mascota contigo de manera instantánea.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-[#4646FA]">
              <div className="bg-[#4646FA]/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <FaQrcode className="text-[#4646FA] text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Identificación Instantánea</h3>
              <p className="text-gray-600 leading-relaxed">
                Cualquier persona con un smartphone puede escanear el código QR y ver 
                la información de tu mascota, contactándote de inmediato.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-[#F4AA44]">
              <div className="bg-[#F4AA44]/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <FaMapMarkerAlt className="text-[#F4AA44] text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Ubicación en Tiempo Real</h3>
              <p className="text-gray-600 leading-relaxed">
                Cuando alguien escanea el código QR, recibes automáticamente la ubicación 
                exacta donde se encontró a tu mascota, acelerando su recuperación.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-[#4646FA]">
              <div className="bg-[#4646FA]/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <FaShieldAlt className="text-[#4646FA] text-3xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Control de Privacidad</h3>
              <p className="text-gray-600 leading-relaxed">
                Tú decides qué información mostrar: dirección, teléfono, email. 
                Mantén tu privacidad mientras proteges a tu mascota.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 text-[#4646FA]">
                Proceso Simple y Efectivo
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-[#4646FA] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-800">Obtén tu Código QR</h4>
                    <p className="text-gray-600">
                      Genera un código QR único o adquiere un collar con código QR en tu veterinaria.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-[#4646FA] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-800">Asocia y Configura</h4>
                    <p className="text-gray-600">
                      Asocia el código QR a tu cuenta y completa el perfil de tu mascota con toda su información.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-[#4646FA] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-800">Protección Activa</h4>
                    <p className="text-gray-600">
                      Si alguien encuentra a tu mascota, puede escanear el código y contactarte inmediatamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/perro-lentes.jpg"
                alt="Perro feliz"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
              Características Principales
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#4646FA]/5 to-[#4646FA]/10 hover:shadow-xl transition-all duration-300">
              <div className="bg-[#4646FA] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaDog className="text-white text-4xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Perros y Gatos</h3>
              <p className="text-gray-600">
                Sistema diseñado para perros, gatos y cualquier tipo de mascota que pueda llevar un collar.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#F4AA44]/5 to-[#F4AA44]/10 hover:shadow-xl transition-all duration-300">
              <div className="bg-[#F4AA44] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaCat className="text-white text-4xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Múltiples Mascotas</h3>
              <p className="text-gray-600">
                Gestiona todas tus mascotas desde una sola cuenta. Cada una tiene su propio perfil y código QR.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#4646FA]/5 to-[#4646FA]/10 hover:shadow-xl transition-all duration-300">
              <div className="bg-[#4646FA] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaPhoneAlt className="text-white text-4xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Contacto Directo</h3>
              <p className="text-gray-600">
                Contacto inmediato por email o WhatsApp cuando alguien encuentra a tu mascota.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#4646FA] to-[#3535E8] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Protege a tu Mascota Hoy
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Únete a miles de dueños que ya protegen a sus mascotas con nuestro sistema.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="flex h-14 items-center justify-center gap-2 rounded-full bg-[#F4AA44] px-8 text-white transition-all duration-300 hover:bg-[#E89A2E] hover:shadow-xl hover:-translate-y-1 font-semibold text-lg shadow-lg"
            >
              <FaHeart className="text-lg" />
              Crear Cuenta Gratis
            </Link>
            <Link
              href="/generate-qr"
              className="flex h-14 items-center justify-center gap-2 rounded-full border-2 border-white bg-transparent text-white px-8 transition-all duration-300 hover:bg-white hover:text-[#4646FA] hover:shadow-xl hover:-translate-y-1 font-semibold text-lg"
            >
              <FaQrcode className="text-lg" />
              Generar Código QR
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}


