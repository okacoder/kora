/**
 * Composant Chat en temps réel pour les salles de jeu
 * Intégré avec WebSocket pour messaging instantané
 */

"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconSend, IconMessageCircle, IconUser, IconRobot, IconLogout, IconLogin, IconCircleCheck } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/use-game-room';
import { useCurrentUser } from '@/hooks/use-current-user';

interface RoomChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  className?: string;
  maxHeight?: string;
}

export function RoomChat({ 
  messages, 
  onSendMessage, 
  className,
  maxHeight = "h-80"
}: RoomChatProps) {
  const user = useCurrentUser();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    const message = inputMessage.trim();
    if (!message) return;

    onSendMessage(message);
    setInputMessage('');
    setIsTyping(false);
    
    // Focus back sur l'input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <IconMessageCircle className="h-4 w-4 text-chart-4" />
          Chat de la salle
          <Badge variant="secondary" className="ml-auto text-xs">
            {messages.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Zone des messages */}
        <div className={cn("border border-border/50 rounded-lg", maxHeight)}>
          <ScrollArea ref={scrollAreaRef} className="h-full p-3">
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <ChatMessageItem 
                    key={message.id} 
                    message={message} 
                    isOwn={message.userId === user?.id}
                    showAvatar={index === 0 || messages[index - 1]?.userId !== message.userId}
                  />
                ))}
              </AnimatePresence>
              
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <IconMessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun message pour le moment</p>
                  <p className="text-xs mt-1">Soyez le premier à dire bonjour !</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Zone de saisie */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Tapez votre message..."
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className="flex-1"
            maxLength={200}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            size="sm"
            className="px-3"
          >
            <IconSend className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Indicateur de frappe */}
        {isTyping && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-chart-4 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-chart-4 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-chart-4 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>Vous tapez...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
}

function ChatMessageItem({ message, isOwn, showAvatar }: ChatMessageItemProps) {
  const getMessageIcon = () => {
    switch (message.type) {
      case 'join':
        return <IconLogin className="h-3 w-3 text-chart-4" />;
      case 'leave':
        return <IconLogout className="h-3 w-3 text-chart-1" />;
      case 'ready':
        return <IconCircleCheck className="h-3 w-3 text-chart-5" />;
      default:
        return null;
    }
  };

  const getMessageStyles = () => {
    if (message.type === 'system') {
      return "bg-muted/30 border border-border/50";
    }
    
    if (isOwn) {
      return "bg-primary text-primary-foreground ml-auto";
    }
    
    return "bg-muted";
  };

  // Messages système (join, leave, ready)
  if (message.type !== 'message') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center justify-center"
      >
        <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground">
          {getMessageIcon()}
          <span>{message.message}</span>
          <span className="text-xs opacity-60">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </motion.div>
    );
  }

  // Messages normaux
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-2 max-w-[80%]",
        isOwn && "flex-row-reverse ml-auto"
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={message.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {message.userId === 'system' ? (
              <IconRobot className="h-3 w-3" />
            ) : (
              message.username.charAt(0).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer si pas d'avatar affiché */}
      {!showAvatar && !isOwn && <div className="w-6" />}

      {/* Contenu du message */}
      <div className={cn("max-w-full", isOwn && "text-right")}>
        {/* Nom d'utilisateur et timestamp */}
        {showAvatar && !isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-card-foreground">
              {message.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}

        {/* Bulle de message */}
        <div className={cn(
          "px-3 py-2 rounded-lg text-sm",
          getMessageStyles()
        )}>
          <p className="break-words">{message.message}</p>
          
          {/* Timestamp pour les messages own */}
          {isOwn && (
            <div className="text-xs opacity-70 mt-1">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}