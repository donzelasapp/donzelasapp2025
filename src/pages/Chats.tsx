import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { supabaseClient } from '../lib/supabase';
import { MessageCircle, Send, User, ArrowLeft } from 'lucide-react';
import { STORAGE_BUCKETS } from '../lib/constants';

type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

type ChatPartner = {
  id: string;
  name: string;
  account_type: 'donzela' | 'plebeu';
  photoUrl?: string;
};

// Componente de Conversas - Gerencia as mensagens entre usuários
const Chats = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  // Carregar parceiros de chat
  useEffect(() => {
    const loadChatPartners = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Buscar conversas existentes
        const { data: chats, error: chatsError } = await supabaseClient
          .from('messages')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        
        if (chatsError) throw chatsError;
        
        if (!chats || chats.length === 0) {
          setChatPartners([]);
          setError('Você ainda não tem conversas.');
          setLoading(false);
          return;
        }
        
        // Extrair IDs únicos de parceiros de chat
        const partnerIds = new Set<string>();
        chats.forEach(chat => {
          const partnerId = chat.sender_id === user.id ? chat.receiver_id : chat.sender_id;
          partnerIds.add(partnerId);
        });
        
        // Buscar informações de perfil de cada parceiro
        const partners = await Promise.all(
          Array.from(partnerIds).map(async (partnerId) => {
            const { data: profile, error: profileError } = await supabaseClient
              .from('profiles')
              .select('id, name, account_type')
              .eq('id', partnerId)
              .single();
            
            if (profileError || !profile) {
              console.error('Erro ao buscar perfil:', profileError);
              return null;
            }
            
            // Buscar foto de perfil
            const { data: files, error: photosError } = await supabaseClient
              .storage
              .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
              .list(partnerId);
            
            let photoUrl = undefined;
            
            if (!photosError && files && files.length > 0) {
              const coverPhoto = files.find(photo => photo.name.startsWith('cover_')) || files[0];
              
              const { data: urlData } = await supabaseClient
                .storage
                .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
                .createSignedUrl(`${partnerId}/${coverPhoto.name}`, 60 * 60);
              
              photoUrl = urlData.signedUrl;
            }
            
            return {
              id: profile.id,
              name: profile.name,
              account_type: profile.account_type,
              photoUrl
            };
          })
        );
        
        // Filtrar nulos e ordenar por nome
        const validPartners = partners.filter(Boolean) as ChatPartner[];
        validPartners.sort((a, b) => a.name.localeCompare(b.name));
        
        setChatPartners(validPartners);
        setError('');
      } catch (err: any) {
        console.error('Erro ao carregar conversas:', err);
        setError('Erro ao carregar conversas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    loadChatPartners();
  }, [user]);

  // Carregar mensagens quando um chat é selecionado
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !selectedChat) return;
      
      try {
        setLoading(true);
        
        // Buscar mensagens entre os usuários
        const { data, error: messagesError } = await supabaseClient
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        
        setMessages(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar mensagens:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
    
    // Configurar listener em tempo real para novas mensagens
    const channel = supabaseClient
      .channel('new-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `or(and(sender_id=eq.${user?.id},receiver_id=eq.${selectedChat?.id}),and(sender_id=eq.${selectedChat?.id},receiver_id=eq.${user?.id}))`
        }, 
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(current => [...current, newMessage]);
        }
      )
      .subscribe();
    
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, selectedChat]);

  // Enviar nova mensagem
  const sendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return;
    
    try {
      const { error } = await supabaseClient
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedChat.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Limpar campo de mensagem
      setNewMessage('');
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  // Renderizar lista de contatos
  const renderChatList = () => (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Conversas</h2>
      
      {error && chatPartners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <MessageCircle className="text-gray-500 mb-3" size={32} />
          <p className="text-gray-300">{error}</p>
          <p className="text-sm text-gray-400 mt-2">
            Inicie uma conversa através dos perfis na home.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chatPartners.map((partner) => (
            <div 
              key={partner.id}
              onClick={() => setSelectedChat(partner)}
              className="flex items-center p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-700 mr-3">
                {partner.photoUrl ? (
                  <img 
                    src={partner.photoUrl} 
                    alt={partner.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/30">
                    <User size={20} className="text-white" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-white">{partner.name}</h3>
                <p className="text-xs text-gray-400">
                  {partner.account_type === 'donzela' ? 'Donzela' : 'Plebeu'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Renderizar área de chat
  const renderChatArea = () => (
    <div className="h-[80vh] bg-gray-900/50 backdrop-blur-sm rounded-xl flex flex-col">
      {/* Cabeçalho do chat */}
      <div className="p-4 border-b border-gray-800 flex items-center">
        <button 
          onClick={() => setSelectedChat(null)}
          className="mr-3 p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-300" />
        </button>
        
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-700 mr-3">
          {selectedChat?.photoUrl ? (
            <img 
              src={selectedChat.photoUrl} 
              alt={selectedChat.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/30">
              <User size={18} className="text-white" />
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-medium text-white">{selectedChat?.name}</h3>
          <p className="text-xs text-gray-400">
            {selectedChat?.account_type === 'donzela' ? 'Donzela' : 'Plebeu'}
          </p>
        </div>
      </div>
      
      {/* Área de mensagens */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <MessageCircle className="text-gray-500 mb-2" size={32} />
            <p className="text-gray-300">Nenhuma mensagem ainda.</p>
            <p className="text-sm text-gray-400">
              Seja o primeiro a dizer olá!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id}
              className={`max-w-[80%] ${message.sender_id === user?.id ? 'self-end' : 'self-start'}`}
            >
              <div className={`px-4 py-2 rounded-2xl ${
                message.sender_id === user?.id 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-800 text-gray-200'
              }`}>
                {message.content}
              </div>
              <div className={`text-xs text-gray-500 mt-1 ${
                message.sender_id === user?.id ? 'text-right' : 'text-left'
              }`}>
                {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Input de mensagem */}
      <div className="p-3 border-t border-gray-800 flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-black/30 rounded-l-lg border border-gray-700 px-4 py-2 text-white focus:outline-none focus:border-primary"
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className={`bg-primary rounded-r-lg px-4 flex items-center justify-center ${
            !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark'
          }`}
        >
          <Send size={20} className="text-white" />
        </button>
      </div>
    </div>
  );

  if (loading && !selectedChat && chatPartners.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-black pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Conversas</h1>
          <p className="text-gray-300 mt-2">
            Converse com suas conexões
          </p>
        </header>
        
        <div className={`${selectedChat ? 'hidden md:block' : ''} md:grid md:grid-cols-3 gap-4`}>
          <div className={`${selectedChat ? 'hidden' : ''} md:block md:col-span-1`}>
            {renderChatList()}
          </div>
          
          <div className={`${!selectedChat ? 'hidden' : ''} md:block md:col-span-2`}>
            {selectedChat && renderChatArea()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chats;
