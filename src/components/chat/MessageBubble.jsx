import { FileText, Image, Download } from "lucide-react";
import { formatMessageTime } from "./chatUtils";

export default function MessageBubble({ message, isOwn, showAvatar, senderName }) {
  const isDeleted = message.is_deleted;

  const renderContent = () => {
    if (isDeleted) return <span className="italic text-muted-foreground text-sm">Message deleted</span>;

    if (message.message_type === "file" || message.message_type === "image") {
      const isImg = message.message_type === "image" || /\.(png|jpg|jpeg|gif|webp)$/i.test(message.file_name || "");
      return (
        <div>
          {isImg ?
          <img src={message.file_url} alt={message.file_name} className="max-w-[200px] rounded-lg object-cover" /> :

          <a href={message.file_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition-colors">
              <FileText className="h-5 w-5 shrink-0" />
              <span className="text-sm truncate max-w-[160px]">{message.file_name || "File"}</span>
              <Download className="h-4 w-4 shrink-0" />
            </a>
          }
          {message.content && <p className="text-sm mt-1">{renderText(message.content)}</p>}
        </div>);

    }

    return <p className="text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: renderText(message.content || "") }} />;
  };

  const renderText = (text) =>
  text.replace(/@(\w+)/g, '<span class="font-semibold opacity-90">@$1</span>');

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn &&
      <div className={`h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 mb-1 ${showAvatar ? "visible" : "invisible"}`}>
          {senderName?.charAt(0).toUpperCase() || "?"}
        </div>
      }
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && showAvatar &&
        <span className="text-xs text-muted-foreground mb-1 ml-1">{senderName}</span>
        }
        <div className={`px-3 py-2 bg-[#3c4e68]/70 ${isOwn ?
        "text-primary-foreground rounded-br-sm" :
        "bg-muted text-foreground rounded-bl-sm"}`}>
          {renderContent()}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 mx-1">
          {formatMessageTime(message.created_date)}
        </span>
      </div>
    </div>);

}