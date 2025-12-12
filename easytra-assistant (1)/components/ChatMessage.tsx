import React from 'react';
import { ChatMessage as ChatMessageType, Role } from '../types';
import { Bot, User, AlertCircle, ExternalLink, Map } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 

interface Props {
  message: ChatMessageType;
}

const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  // Simple heuristic to detect if the model is reporting heavy traffic
  const hasHeavyTraffic = !isUser && message.text.toLowerCase().match(/(heavy traffic|congestion|high traffic|traffic jam|gridlock|delays? due to traffic)/i);

  // Filter for map chunks, but only take the first one (Single Map policy)
  const mapChunks = message.groundingChunks?.filter(c => c.maps?.uri) || [];
  const primaryMapChunk = mapChunks.length > 0 ? mapChunks[0] : null;

  return (
    <div className={`flex w-full gap-4 py-6 ${isUser ? 'bg-white' : 'bg-slate-50/50'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
        isUser ? 'bg-indigo-100 text-indigo-600' : isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
      }`}>
        {isUser ? <User size={18} /> : isError ? <AlertCircle size={18} /> : <Bot size={18} />}
      </div>
      
      <div className="flex-1 overflow-hidden space-y-4">
        {/* Message Text with Friendly Markdown Formatting */}
        <div className={`prose prose-slate max-w-none ${isUser ? 'text-slate-700' : 'text-slate-800'}`}>
          <ReactMarkdown
            components={{
              // Optional: Customize link rendering if links appear in text
              a: ({node, ...props}) => <span className="text-indigo-600 font-medium" {...props} />
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>

        {/* Primary Map Embed (Single Map Only) */}
        {primaryMapChunk && primaryMapChunk.maps?.uri && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            {(() => {
              const title = primaryMapChunk.maps.title || "Location";
              // Construct a basic embed URL using the location title
              const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(title)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

              return (
                <div 
                  className={`relative w-full h-64 md:h-80 rounded-xl overflow-hidden bg-slate-100 border transition-all duration-500
                    ${hasHeavyTraffic 
                      ? 'border-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]' 
                      : 'border-slate-200 shadow-sm'
                    }`}
                >
                  <iframe
                    title={title}
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    style={{ border: 0 }}
                    loading="lazy"
                    className="opacity-95 hover:opacity-100 transition-opacity"
                  />
                  
                  {/* Heavy Traffic Warning Badge */}
                  {hasHeavyTraffic && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse z-10 border border-red-400">
                      <AlertCircle size={14} className="fill-red-600 text-white" />
                      <span>HEAVY TRAFFIC DETECTED</span>
                    </div>
                  )}

                  {/* Map Card Footer */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-medium truncate max-w-[70%]">
                      <Map size={14} className={`${hasHeavyTraffic ? 'text-red-500' : 'text-indigo-600'} flex-shrink-0`} />
                      <span className="truncate">{title}</span>
                    </div>
                    <a 
                      href={primaryMapChunk.maps.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold whitespace-nowrap ml-2 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                    >
                      Open App <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;