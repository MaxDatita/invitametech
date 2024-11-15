'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Clock, MessageSquare, UserCheck, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query';

const gradientColors = [
  'from-red-400 to-pink-600',
  'from-orange-400 to-red-600',
  'from-yellow-400 to-orange-600',
  'from-green-400 to-emerald-600',
  'from-teal-400 to-cyan-600',
  'from-blue-400 to-indigo-600',
  'from-indigo-400 to-purple-600',
  'from-purple-400 to-pink-600',
]

const getConsistentGradient = (name: string) => {
  if (!name) return gradientColors[0];
  
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return gradientColors[hash % gradientColors.length];
}

const InitialsCircle = ({ name }: { name: string }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : ''
  const gradient = getConsistentGradient(name)
  
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 bg-gradient-to-br ${gradient}`}>
      {initials}
    </div>
  )
}

interface MessageCardProps {
  message: {
    id: number;
    nombre: string;
    mensaje: string;
  };
  onClick: () => void;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
  return (
    <div className="w-64 p-4 bg-white rounded-lg shadow-md cursor-pointer flex-shrink-0" onClick={onClick}>
      <div className="flex items-center mb-2">
        <div className="flex-shrink-0">
          <InitialsCircle name={message.nombre} />
        </div>
        <span className="font-semibold truncate overflow-hidden flex-1">
          {message.nombre}
        </span>
      </div>
      <p className="text-sm line-clamp-2 leading-normal whitespace-normal break-words">
        {message.mensaje}
      </p>
    </div>
  )
}

interface ApiMessage {
  nombre: string;
  mensaje: string;
}

export function InvitacionDigitalComponent() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [eventStarted, setEventStarted] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ApiMessage | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [newMessage, setNewMessage] = useState({
    nombre: '',
    mensaje: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const eventDate = useMemo(() => {
    return new Date('2024-04-20T19:00:00'); //Fecha de celebración
  }, []);
  const contentActivationDate = new Date('2024-10-01T00:00:00') //Fecha de activación del contenido
  const rsvpDeadline = new Date('2024-12-15T00:00:00') //Fecha de cierre de asistencia

  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Datos recibidos del API:', data);
      return data;
    },
  });

  console.log('Estado de la consulta:', { isLoading, error, messages });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentDate(now)
      const difference = eventDate.getTime() - now.getTime()

      if (difference <= 0) {
        setEventStarted(true)
        clearInterval(interval)
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24))
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const m = Math.floor((difference / 1000 / 60) % 60)
        const s = Math.floor((difference / 1000) % 60)
        setCountdown({ days: d, hours: h, minutes: m, seconds: s })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [eventDate])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (eventStarted && carouselRef.current) {
      const scrollWidth = messages.length * 272
      let scrollPosition = 0

      const scroll = () => {
        if (!carouselRef.current) return;
        scrollPosition += 1
        if (scrollPosition >= scrollWidth) {
          scrollPosition = 0
        }
        carouselRef.current.scrollLeft = scrollPosition
      }

      const intervalId = setInterval(scroll, 50)
      return () => clearInterval(intervalId)
    }
  }, [eventStarted, messages.length])

  const isContentActive = currentDate >= contentActivationDate
  const isRsvpActive = currentDate < rsvpDeadline

  const handleMessageClick = useCallback((message: { id: number; nombre: string; mensaje: string }) => {
    setSelectedMessage({
      nombre: message.nombre,
      mensaje: message.mensaje
    })
  }, [])

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.nombre || !newMessage.mensaje) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const fecha = now.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha,
          nombre: newMessage.nombre,
          mensaje: newMessage.mensaje
        }),
      });

      if (!response.ok) throw new Error('Error al enviar el mensaje');

      setNewMessage({ nombre: '', mensaje: '' });
      setIsMessageDialogOpen(false);
      await refetch();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-pink-100 to-purple-200 p-4">
      <div className="w-full max-w-md">
        <video
          className="w-full h-64 object-cover rounded-lg shadow-lg mb-4"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/vid1.mp4" type="video/mp4" />
          Tu navegador no soporta el tag de video.
        </video>

        <h1 className="text-3xl font-bold text-center text-purple-800 mb-4">¡Celebremos Juntos!</h1>

        <div className="relative w-full h-[20vh] mb-4">
          {['/img1.webp', '/img2.webp', '/img3.webp'].map((src, index) => (
            <Image
              key={index}
              src={src}
              alt={`Imagen de celebración ${index + 1}`}
              fill
              className={`object-cover rounded-lg shadow-lg transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>

        <p className="text-center text-lg mb-4">
          {eventStarted ? '¡Celebra con nosotros en este día especial!' : 'Te invitamos a celebrar con nosotros este día tan especial'}
        </p>

        {eventStarted ? (
          <div className="mb-6">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
              </div>
            ) : error ? (
              <p>Error al cargar mensajes</p>
            ) : messages.length === 0 ? (
              <p>No hay mensajes</p>
            ) : (
              <>
                <div ref={carouselRef} className="overflow-x-hidden whitespace-nowrap">
                  <div className="inline-flex gap-4" style={{ width: `${messages.length * 272 * 2}px` }}>
                    {messages.map((message: { id: number; nombre: string; mensaje: string }) => (
                      <MessageCard key={message.id} message={message} onClick={() => handleMessageClick(message)} />
                    ))}
                    {messages.map((message: { id: number; nombre: string; mensaje: string }) => (
                      <MessageCard key={`duplicate-${message.id}`} message={message} onClick={() => handleMessageClick(message)} />
                    ))}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full" 
                  onClick={() => setSelectedMessage({ 
                    nombre: 'Todos los mensajes', 
                    mensaje: '' 
                  })}
                >
                  Ver todos los mensajes
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center mb-6">
            <div>
              <span className="text-2xl font-bold">{countdown.days}</span>
              <p className="text-sm">Días</p>
            </div>
            <div>
              <span className="text-2xl font-bold">{countdown.hours}</span>
              <p className="text-sm">Horas</p>
            </div>
            <div>
              <span className="text-2xl font-bold">{countdown.minutes}</span>
              <p className="text-sm">Minutos</p>
            </div>
            <div>
              <span className="text-2xl font-bold">{countdown.seconds}</span>
              <p className="text-sm">Segundos</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="flex items-center justify-center">
            <MapPin className="mr-2 h-4 w-4" /> Ubicación
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center justify-center">
                <Clock className="mr-2 h-4 w-4" /> Cronograma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Cronograma del Evento</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {isContentActive ? (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <span className="font-bold">18:00</span>
                      <span className="col-span-3">Recepción de invitados</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <span className="font-bold">19:00</span>
                      <span className="col-span-3">Cena</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <span className="font-bold">20:00</span>
                      <span className="col-span-3">Baile y celebración</span>
                    </div>
                  </>
                ) : (
                  <p>El cronograma del evento estará disponible a partir del {contentActivationDate.toLocaleDateString()}.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center justify-center">
                <ImageIcon className="mr-2 h-4 w-4" /> Contenido
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Contenido del Evento</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {isContentActive ? (
                  <a href="https://drive.google.com/drive/folders/your-folder-id" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Ver contenido del evento
                  </a>
                ) : (
                  <p>El contenido del evento estará disponible a partir del {contentActivationDate.toLocaleDateString()}.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center justify-center">
                <MessageSquare className="mr-2 h-4 w-4" /> Mensajes
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Deja un mensaje</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitMessage} className="grid gap-4 py-4">
                {isContentActive ? (
                  <>
                    <Input 
                      id="name" 
                      placeholder="Tu nombre" 
                      value={newMessage.nombre}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        nombre: e.target.value
                      }))}
                      required
                    />
                    <Textarea 
                      placeholder="Tu mensaje" 
                      value={newMessage.mensaje}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        mensaje: e.target.value
                      }))}
                      required
                    />
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                    </Button>
                  </>
                ) : (
                  <p>Podrás dejar mensajes para el agasajado a partir del {contentActivationDate.toLocaleDateString()}.</p>
                )}
              </form>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                className="col-span-2 flex items-center justify-center"
                disabled={!isRsvpActive}
              >
                <UserCheck className="mr-2 h-4 w-4" /> Asistiré
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirma tu asistencia</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {isRsvpActive ? (
                  <>
                    <Input id="name" placeholder="Nombre del invitado" />
                    <Input id="guests" type="number" placeholder="Nmero de personas" />
                    <Textarea placeholder="Nota adicional" />
                    <Button type="submit">Confirmar asistencia</Button>
                  </>
                ) : (
                  <p>Lo sentimos, el período para confirmar asistencia ha terminado.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedMessage?.nombre && selectedMessage.nombre !== 'Todos los mensajes' && (
                <InitialsCircle name={selectedMessage.nombre} />
              )}
              {selectedMessage?.nombre || 'Mensaje'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedMessage?.nombre === 'Todos los mensajes' ? (
              <div className="space-y-4 max-h-[calc(4*5rem)] overflow-y-auto">
                {messages.map((message: { id: number; nombre: string; mensaje: string }) => (
                  <div key={message.id} className="flex items-start p-2 bg-white rounded-lg shadow min-h-[5rem]">
                    <div className="flex-shrink-0">
                      <InitialsCircle name={message.nombre} />
                    </div>
                    <div className="ml-3 flex-grow">
                      <h3 className="font-semibold">{message.nombre}</h3>
                      <p className="text-sm whitespace-normal break-words">{message.mensaje}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>{selectedMessage?.mensaje}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}