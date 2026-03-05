import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  ChakraProvider,
  Box,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Tooltip,
  extendTheme,
} from "@chakra-ui/react";
import ScrollableFeed from "react-scrollable-feed";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

const theme = extendTheme({
  fonts: {
    heading: `'Cormorant Garamond', Georgia, serif`,
    body: `'Cormorant Garamond', Georgia, serif`,
  },
});

type Message = { role: string; content: string; fileName?: string; time?: string };
type Conversation = { id: string; title: string; messages: Message[] };

const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return displayed;
}

function AIBubble({ content, isLatest }: { content: string; isLatest: boolean }) {
  const displayed = useTypewriter(isLatest ? content : "");
  const text = isLatest ? displayed : content;
  return (
    <MotionBox
      className="bubble-ai"
      px="4" py="3" maxW="270px" wordBreak="break-word"
      fontSize="15px" lineHeight="1.7"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {text}
      {isLatest && displayed.length < content.length && (
        <span className="cursor-blink">|</span>
      )}
    </MotionBox>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body { height: 100%; background: #1a0e18; overflow: hidden; }

.sakura-root {
  width: 100vw; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  font-family: 'Cormorant Garamond', serif;
}
.sky {
  position: fixed; inset: 0; z-index: 0;
  background: linear-gradient(180deg, #1a1028 0%, #2d1f3d 20%, #5c3060 40%, #c96b8a 60%, #f4a7b9 75%, #f9d3b0 85%, #fde8ef 100%);
}
.moon {
  position: fixed; top: 7%; right: 16%; width: 64px; height: 64px; border-radius: 50%; z-index: 1;
  background: radial-gradient(circle at 35% 35%, #fff8e7, #ffe8b0 50%, #f9d070);
  box-shadow: 0 0 40px 15px rgba(249,208,112,0.3);
  animation: moonGlow 4s ease-in-out infinite alternate;
}
@keyframes moonGlow {
  from { box-shadow: 0 0 40px 15px rgba(249,208,112,0.3); }
  to   { box-shadow: 0 0 60px 22px rgba(249,208,112,0.45); }
}
.star {
  position: absolute; border-radius: 50%; background: white;
  animation: twinkle var(--d) ease-in-out infinite alternate;
  animation-delay: var(--dl);
}
@keyframes twinkle {
  from { opacity: var(--oa); } to { opacity: var(--ob); }
}
.mist {
  position: fixed; z-index: 2; left: -20%; right: -20%; border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(253,232,239,0.55) 0%, transparent 70%);
  animation: mistDrift var(--md) ease-in-out infinite alternate;
}
@keyframes mistDrift {
  from { transform: translateX(-25px); opacity: 0.45; }
  to   { transform: translateX(25px); opacity: 0.75; }
}
.petal-el {
  position: fixed; border-radius: 80% 20% 80% 20%; pointer-events: none; z-index: 3;
  background: radial-gradient(ellipse at 40% 40%, #fff0f5, #f4a7b9 60%, #e88ba8);
  animation: petalFall var(--pd) var(--dl) linear infinite; opacity: 0;
}
@keyframes petalFall {
  0%   { opacity: 0; transform: translateX(0) rotate(0deg) translateY(0); }
  5%   { opacity: 0.9; }
  90%  { opacity: 0.7; }
  100% { opacity: 0; transform: translateX(var(--drift)) rotate(var(--rot)) translateY(105vh); }
}
.ui-shell {
  position: relative; z-index: 10;
  display: flex; align-items: stretch;
  width: min(680px, 98vw); height: min(680px, 96vh);
}
.sidebar {
  height: 100%; background: rgba(10,5,15,0.78); backdrop-filter: blur(20px);
  border: 1px solid rgba(244,167,185,0.2); border-right: none;
  border-radius: 24px 0 0 24px;
  display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;
}
.sidebar-header {
  padding: 18px 14px 12px; border-bottom: 1px solid rgba(244,167,185,0.15);
  display: flex; align-items: center; justify-content: space-between;
}
.sidebar-list { flex: 1; overflow-y: auto; padding: 8px; scrollbar-width: thin; }
.convo-item {
  padding: 9px 11px; border-radius: 12px; cursor: pointer; margin-bottom: 4px;
  border: 1px solid transparent; display: flex; align-items: center; gap: 7px; transition: all 0.2s;
}
.convo-item:hover { background: rgba(244,167,185,0.1); }
.convo-item.active { background: rgba(201,107,138,0.2); border-color: rgba(244,167,185,0.3); }
.convo-title { font-size: 13px; color: rgba(253,232,239,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.del-btn { opacity: 0; transition: opacity 0.2s; cursor: pointer; color: rgba(244,167,185,0.55); font-size: 11px; background: none; border: none; }
.convo-item:hover .del-btn { opacity: 1; }
.new-chat-btn {
  background: rgba(201,107,138,0.22); border: 1px solid rgba(244,167,185,0.32);
  border-radius: 8px; color: #fde8ef; cursor: pointer; padding: 3px 10px; font-size: 19px; line-height: 1; transition: all 0.2s;
}
.new-chat-btn:hover { background: rgba(201,107,138,0.38); }
.chat-panel {
  flex: 1; height: 100%;
  background: rgba(15,8,18,0.65); backdrop-filter: blur(22px) saturate(180%);
  border: 1px solid rgba(244,167,185,0.28);
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 28px 70px rgba(0,0,0,0.55), 0 0 60px rgba(201,107,138,0.12);
}
.chat-header {
  padding: 14px 18px 12px;
  background: linear-gradient(135deg, rgba(201,107,138,0.22), rgba(61,100,148,0.12));
  border-bottom: 1px solid rgba(244,167,185,0.18);
  display: flex; align-items: center; gap: 11px; flex-shrink: 0;
}
.toggle-btn {
  background: rgba(244,167,185,0.1); border: 1px solid rgba(244,167,185,0.22);
  border-radius: 9px; color: #fde8ef; cursor: pointer; padding: 5px 9px; font-size: 13px; transition: all 0.2s; flex-shrink: 0;
}
.toggle-btn:hover { background: rgba(244,167,185,0.2); }
.avatar-ai {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #f4a7b9, #c96b8a, #8b4f7a);
  display: flex; align-items: center; justify-content: center; font-size: 19px;
  animation: avatarPulse 2.5s ease-in-out infinite;
}
@keyframes avatarPulse {
  0%,100% { box-shadow: 0 0 18px rgba(201,107,138,0.5); }
  50%      { box-shadow: 0 0 30px rgba(244,167,185,0.75); }
}
.msg-avatar-ai {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #f4a7b9, #c96b8a);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
  align-self: flex-end; margin-right: 7px;
}
.msg-avatar-user {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #9b4f75, #6b3355);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
  align-self: flex-end; margin-left: 7px;
}
.feed-area {
  flex: 1; overflow-y: auto; padding: 16px;
  scrollbar-width: thin; scrollbar-color: rgba(244,167,185,0.3) transparent;
}
.feed-area::-webkit-scrollbar { width: 4px; }
.feed-area::-webkit-scrollbar-thumb { background: rgba(244,167,185,0.3); border-radius: 4px; }
.bubble-user {
  background: linear-gradient(135deg, #c96b8a, #9b4f75);
  color: #fff5f8; border-radius: 18px 18px 4px 18px;
  box-shadow: 0 4px 18px rgba(201,107,138,0.35);
  font-family: 'Cormorant Garamond', serif;
}
.bubble-ai {
  background: rgba(255,255,255,0.08); color: #fde8ef;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid rgba(244,167,185,0.22);
  box-shadow: 0 4px 18px rgba(0,0,0,0.3);
  font-family: 'Cormorant Garamond', serif;
}
.msg-time { font-size: 10px; color: rgba(244,167,185,0.4); margin-top: 3px; letter-spacing: 0.04em; }
.file-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(244,167,185,0.14); border: 1px solid rgba(244,167,185,0.3);
  border-radius: 10px; padding: 5px 11px; font-size: 12px; color: rgba(253,232,239,0.85); margin-bottom: 4px;
}
.cursor-blink { display: inline-block; margin-left: 1px; color: rgba(244,167,185,0.8); animation: cursorBlink 0.7s ease-in-out infinite; }
@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
.input-area {
  padding: 10px 14px 16px; flex-shrink: 0;
  border-top: 1px solid rgba(244,167,185,0.15); background: rgba(0,0,0,0.2);
}
.input-wrap {
  background: rgba(255,255,255,0.07); border: 1px solid rgba(244,167,185,0.22);
  border-radius: 999px; transition: all 0.3s;
  display: flex; align-items: center; flex: 1; padding: 0 12px; gap: 6px;
}
.input-wrap:focus-within { border-color: rgba(244,167,185,0.6); box-shadow: 0 0 18px rgba(201,107,138,0.22); }
.clip-btn { background: none; border: none; cursor: pointer; color: rgba(244,167,185,0.55); display: flex; align-items: center; padding: 0; transition: color 0.2s; flex-shrink: 0; }
.clip-btn:hover { color: rgba(244,167,185,1); }
.dot { display:inline-block; border-radius:50%; width:7px; height:7px; background:rgba(244,167,185,0.8); animation: dotBounce 1.1s ease-in-out infinite; }
.dot:nth-child(2){animation-delay:.18s} .dot:nth-child(3){animation-delay:.36s}
@keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:0.5} 40%{transform:translateY(-5px);opacity:1} }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #7dffb3; box-shadow: 0 0 8px #7dffb3; animation: statusPulse 2s ease-in-out infinite; }
@keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@media (max-width: 600px) {
  .sidebar { display: none; }
  .chat-panel { border-radius: 0 !important; border: none !important; }
  .ui-shell { width: 100vw; height: 100vh; }
}
`;

export default function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [latestAiIndex, setLatestAiIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const makeConvo = (): Conversation => ({ id: Date.now().toString(), title: "New Chat", messages: [] });
  const [conversations, setConversations] = useState<Conversation[]>([makeConvo()]);
  const [activeId, setActiveId] = useState<string>(conversations[0].id);
  const activeConvo = conversations.find((c) => c.id === activeId)!;
  const chat = activeConvo?.messages ?? [];

  const updateMessages = (id: string, msgs: Message[]) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const title = msgs.find((m) => m.role === "user")?.content.replace(/^📎\s*/, "").slice(0, 28) || "New Chat";
        return { ...c, messages: msgs, title };
      })
    );
  };

  const startNewChat = () => {
    const c = makeConvo();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  };

  const deleteConvo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) { const f = makeConvo(); setActiveId(f.id); return [f]; }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const sendMessage = async () => {
    if (!message.trim() && !uploadedFile) return;
    const fileName = uploadedFile?.name;
    const userMsg: Message = { role: "user", content: message || `📎 ${fileName}`, fileName, time: getTime() };
    const updated = [...chat, userMsg];
    updateMessages(activeId, updated);
    setMessage(""); setUploadedFile(null); setLoading(true);
    try {
      const formData = new FormData();
      formData.append("message", message);
      if (uploadedFile) formData.append("file", uploadedFile);
      const res = await axios.post("https://tech-llm-website-2.onrender.com/chat", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const aiMsg: Message = { role: "ai", content: res.data.reply, time: getTime() };
      const newMsgs = [...updated, aiMsg];
      updateMessages(activeId, newMsgs);
      setLatestAiIndex(newMsgs.length - 1);
    } catch {
      updateMessages(activeId, [...updated, { role: "ai", content: "Error: Cannot load AI assistant.", time: getTime() }]);
    } finally { setLoading(false); }
  };

  const stars = useRef(Array.from({ length: 70 }, (_, i) => ({ id: i, left: `${Math.random()*100}%`, top: `${Math.random()*45}%`, size: Math.random()*2.2+0.6, d: `${(Math.random()*3+2).toFixed(1)}s`, dl: `${(Math.random()*5).toFixed(1)}s`, oa: (Math.random()*0.25+0.1).toFixed(2), ob: (Math.random()*0.5+0.5).toFixed(2) }))).current;
  const petals = useRef(Array.from({ length: 24 }, (_, i) => ({ id: i, left: `${Math.random()*110-5}%`, w: Math.random()*9+8, pd: `${(Math.random()*8+6).toFixed(1)}s`, dl: `${(Math.random()*14).toFixed(1)}s`, drift: `${((Math.random()-0.5)*200).toFixed(0)}px`, rot: `${Math.random()>0.5?360:-360}deg` }))).current;

  return (
    <ChakraProvider theme={theme}>
      <style>{styles}</style>
      <div className="sakura-root">
        <div className="sky" />
        <div className="moon" />

        <div style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none" }}>
          {stars.map((s) => (
            <div key={s.id} className="star" style={{ left:s.left, top:s.top, width:s.size, height:s.size, "--d":s.d, "--dl":s.dl, "--oa":s.oa, "--ob":s.ob } as React.CSSProperties}/>
          ))}
        </div>

        <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMax slice"
          style={{ position:"fixed", bottom:0, left:0, width:"100%", height:"70%", zIndex:1 }}>
          <polygon points="0,500 200,180 400,500" fill="#1e1535" opacity="0.88"/>
          <polygon points="150,500 420,115 690,500" fill="#251c40" opacity="0.9"/>
          <polygon points="500,500 750,75 1000,500" fill="#2d2250" opacity="0.82"/>
          <polygon points="800,500 1050,138 1300,500" fill="#1e1535" opacity="0.88"/>
          <polygon points="1100,500 1320,160 1440,310 1440,500" fill="#251c40" opacity="0.9"/>
          <polygon points="390,162 420,115 450,162" fill="rgba(255,255,255,0.5)"/>
          <polygon points="720,116 750,75 780,116" fill="rgba(255,255,255,0.55)"/>
          <polygon points="0,500 180,265 360,500" fill="#3d2060" opacity="0.75"/>
          <polygon points="300,500 550,205 800,500" fill="#4a2870" opacity="0.7"/>
          <polygon points="700,500 950,235 1200,500" fill="#3d2060" opacity="0.75"/>
          <ellipse cx="720" cy="495" rx="900" ry="90" fill="#120a18"/>
        </svg>

        <svg viewBox="0 0 1440 380" preserveAspectRatio="xMidYMax slice"
          style={{ position:"fixed", bottom:0, left:0, width:"100%", height:"50%", zIndex:2, pointerEvents:"none" }}>
          <rect x="80" y="190" width="13" height="190" fill="#1a0e18" rx="6"/>
          <ellipse cx="76" cy="182" rx="44" ry="34" fill="rgba(244,167,185,0.88)"/>
          <ellipse cx="114" cy="167" rx="38" ry="29" fill="rgba(249,195,205,0.82)"/>
          <rect x="1347" y="175" width="13" height="205" fill="#1a0e18" rx="6"/>
          <ellipse cx="1360" cy="165" rx="48" ry="37" fill="rgba(244,167,185,0.88)"/>
          <ellipse cx="1322" cy="150" rx="40" ry="31" fill="rgba(249,195,205,0.82)"/>
        </svg>

        <div className="mist" style={{ bottom:"33%", height:75, "--md":"8s" } as React.CSSProperties}/>
        <div className="mist" style={{ bottom:"27%", height:48, "--md":"12s", opacity:0.4 } as React.CSSProperties}/>

        {petals.map((p) => (
          <div key={p.id} className="petal-el" style={{ left:p.left, width:p.w, height:p.w*0.76, "--pd":p.pd, "--dl":p.dl, "--drift":p.drift, "--rot":p.rot } as React.CSSProperties}/>
        ))}

        <div className="ui-shell">
          {/* Sidebar */}
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <MotionBox
                key="sidebar"
                className="sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 210, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                overflow="hidden"
                minW={0}
              >
                <div className="sidebar-header">
                  <Text fontSize="13px" fontWeight="600" color="rgba(253,232,239,0.9)" letterSpacing="0.07em">🌸 History</Text>
                  <button className="new-chat-btn" onClick={startNewChat}>+</button>
                </div>
                <div className="sidebar-list">
                  {conversations.map((c) => (
                    <div key={c.id} className={`convo-item ${c.id === activeId ? "active" : ""}`} onClick={() => setActiveId(c.id)}>
                      <span style={{ fontSize:13 }}>💬</span>
                      <span className="convo-title">{c.title}</span>
                      <button className="del-btn" onClick={(e) => deleteConvo(c.id, e)}>✕</button>
                    </div>
                  ))}
                </div>
                <Box p="3" borderTop="1px solid rgba(244,167,185,0.12)">
                  <Text fontSize="10px" color="rgba(244,167,185,0.4)" textAlign="center" letterSpacing="0.1em">
                    ✿ {conversations.length} chat{conversations.length !== 1 ? "s" : ""}
                  </Text>
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Chat panel */}
          <div className="chat-panel" style={{ borderRadius: sidebarOpen ? "0 28px 28px 0" : "28px", borderLeft: sidebarOpen ? "none" : "1px solid rgba(244,167,185,0.28)" }}>

            <div className="chat-header">
              <button className="toggle-btn" onClick={() => setSidebarOpen(o => !o)}>{sidebarOpen ? "◀" : "▶"}</button>
              <div className="avatar-ai">🌸</div>
              <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
                <Text fontSize="16px" fontWeight="600" color="#fde8ef" letterSpacing="0.04em" lineHeight={1} noOfLines={1}>
                  What Can I Do for You Today?
                </Text>
                <Text fontSize="11px" color="rgba(244,167,185,0.5)" fontWeight="300" noOfLines={1}>
                  {activeConvo?.title === "New Chat" ? "Start a conversation" : activeConvo?.title}
                </Text>
              </VStack>
              <div className="status-dot"/>
            </div>

            <div className="feed-area">
              <ScrollableFeed>
                {chat.length === 0 && (
                  <Text textAlign="center" color="rgba(244,167,185,0.35)" fontSize="sm" mt="10" fontStyle="italic" letterSpacing="0.08em">
                    ✿ ask anything under the blossoms ✿
                  </Text>
                )}

                {chat.map((c, i) => (
                  <MotionBox
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    display="flex"
                    justifyContent={c.role === "user" ? "flex-end" : "flex-start"}
                    mb="3"
                  >
                    {c.role === "ai" && <div className="msg-avatar-ai">🌸</div>}

                    <VStack align={c.role === "user" ? "flex-end" : "flex-start"} spacing="1">
                      {c.fileName && <div className="file-chip"><span>📎</span><span>{c.fileName}</span></div>}
                      {c.content && c.content !== `📎 ${c.fileName}` && (
                        c.role === "ai" ? (
                          <AIBubble content={c.content} isLatest={i === latestAiIndex} />
                        ) : (
                          <MotionBox
                            className="bubble-user"
                            px="4" py="2.5" maxW="270px" wordBreak="break-word"
                            fontSize="15px" lineHeight="1.65"
                            initial={{ opacity:0, y:8, scale:0.96 }}
                            animate={{ opacity:1, y:0, scale:1 }}
                            transition={{ duration:0.3, ease:"easeOut" }}
                          >
                            {c.content}
                          </MotionBox>
                        )
                      )}
                      {c.time && <div className="msg-time">{c.time}</div>}
                    </VStack>

                    {c.role === "user" && <div className="msg-avatar-user">🧑</div>}
                  </MotionBox>
                ))}

                <AnimatePresence>
                  {loading && (
                    <MotionBox
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      display="flex" alignItems="center" mb="3"
                    >
                      <div className="msg-avatar-ai">🌸</div>
                      <Box className="bubble-ai" px="4" py="3" display="inline-flex" alignItems="center" gap="6px">
                        <span className="dot"/><span className="dot"/><span className="dot"/>
                      </Box>
                    </MotionBox>
                  )}
                </AnimatePresence>
              </ScrollableFeed>
            </div>

            <AnimatePresence>
              {uploadedFile && (
                <MotionBox
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  px="4" py="2" borderTop="1px solid rgba(244,167,185,0.12)" bg="rgba(0,0,0,0.1)"
                >
                  <HStack>
                    <Text fontSize="12px" color="rgba(244,167,185,0.8)">📎 {uploadedFile.name}</Text>
                    <Button size="xs" variant="ghost" color="rgba(244,167,185,0.6)" onClick={() => setUploadedFile(null)} _hover={{ color:"#fde8ef" }} ml="auto">✕</Button>
                  </HStack>
                </MotionBox>
              )}
            </AnimatePresence>

            <div className="input-area">
              <input ref={fileInputRef} type="file" style={{ display:"none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadedFile(f); e.target.value=""; }}/>
              <HStack>
                <div className="input-wrap">
                  <Tooltip label="Attach file" placement="top">
                    <button className="clip-btn" onClick={() => fileInputRef.current?.click()}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                      </svg>
                    </button>
                  </Tooltip>
                  <Input variant="unstyled" placeholder="Whisper your question…" value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    color="#fde8ef" fontSize="15px" fontFamily="'Cormorant Garamond', serif" py="2"
                    _placeholder={{ color:"rgba(244,167,185,0.45)", fontStyle:"italic" }}/>
                </div>
                <Button onClick={sendMessage} isLoading={loading}
                  borderRadius="full" w="46px" h="46px" minW="46px" p={0}
                  bg="linear-gradient(135deg, #f4a7b9, #c96b8a)" color="white" border="none"
                  boxShadow="0 4px 18px rgba(201,107,138,0.45)"
                  _hover={{ transform:"scale(1.08)", boxShadow:"0 6px 28px rgba(201,107,138,0.65)" }}
                  _active={{ transform:"scale(0.95)" }} transition="all 0.2s">
                  {!loading && (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </Button>
              </HStack>
            </div>
          </div>
        </div>
      </div>
    </ChakraProvider>
  );
}