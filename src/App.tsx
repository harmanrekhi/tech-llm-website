import { useState, useRef } from "react";
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

// ── Types ─────────────────────────────────────────────────────────────────────
type Message = { role: string; content: string; fileName?: string };
type Conversation = { id: string; title: string; messages: Message[] };

// ── Styles ────────────────────────────────────────────────────────────────────
const sceneStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&display=swap');
* { box-sizing: border-box; }

.sakura-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #1a0e18;
  font-family: 'Cormorant Garamond', serif;
}
.sky {
  position: fixed; inset: 0; z-index: 0;
  background: linear-gradient(180deg,
    #1a1028 0%, #2d1f3d 20%, #5c3060 40%,
    #c96b8a 60%, #f4a7b9 75%, #f9d3b0 85%, #fde8ef 100%);
}
.moon {
  position: fixed; top: 7%; right: 16%;
  width: 64px; height: 64px; border-radius: 50%; z-index: 1;
  background: radial-gradient(circle at 35% 35%, #fff8e7, #ffe8b0 50%, #f9d070);
  box-shadow: 0 0 40px 15px rgba(249,208,112,0.3), 0 0 80px 30px rgba(249,208,112,0.15);
  animation: moonGlow 4s ease-in-out infinite alternate;
}
@keyframes moonGlow {
  from { box-shadow: 0 0 40px 15px rgba(249,208,112,0.3), 0 0 80px 30px rgba(249,208,112,0.15); }
  to   { box-shadow: 0 0 60px 22px rgba(249,208,112,0.45), 0 0 110px 44px rgba(249,208,112,0.2); }
}
.stars-layer { position: fixed; inset: 0; z-index: 1; pointer-events: none; }
.star {
  position: absolute; border-radius: 50%; background: white;
  animation: twinkle var(--d) ease-in-out infinite alternate;
  animation-delay: var(--dl);
}
@keyframes twinkle {
  from { opacity: var(--oa); transform: scale(1); }
  to   { opacity: var(--ob); transform: scale(1.4); }
}
.mist {
  position: fixed; z-index: 2; left: -20%; right: -20%; border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(253,232,239,0.55) 0%, transparent 70%);
  animation: mistDrift var(--md) ease-in-out infinite alternate;
}
@keyframes mistDrift {
  from { transform: translateX(-25px) scaleY(1); opacity: 0.45; }
  to   { transform: translateX(25px) scaleY(1.3); opacity: 0.75; }
}
.petal-el {
  position: fixed; border-radius: 80% 20% 80% 20%; pointer-events: none; z-index: 3;
  background: radial-gradient(ellipse at 40% 40%, #fff0f5, #f4a7b9 60%, #e88ba8);
  filter: drop-shadow(0 2px 3px rgba(201,107,138,0.35));
  animation: petalFall var(--pd) var(--dl) linear infinite; opacity: 0;
}
@keyframes petalFall {
  0%   { opacity: 0; transform: translateX(0) rotate(0deg) translateY(0); }
  5%   { opacity: 0.9; }
  90%  { opacity: 0.7; }
  100% { opacity: 0; transform: translateX(var(--drift)) rotate(var(--rot)) translateY(105vh); }
}

/* ── Sidebar ── */
.sidebar {
  height: 660px;
  background: rgba(10,5,15,0.72);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(244,167,185,0.2);
  border-right: none;
  border-radius: 24px 0 0 24px;
  display: flex; flex-direction: column;
  overflow: hidden; flex-shrink: 0;
}
.sidebar-header {
  padding: 18px 14px 12px;
  border-bottom: 1px solid rgba(244,167,185,0.15);
  display: flex; align-items: center; justify-content: space-between;
}
.sidebar-list {
  flex: 1; overflow-y: auto; padding: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(244,167,185,0.2) transparent;
}
.sidebar-list::-webkit-scrollbar { width: 3px; }
.sidebar-list::-webkit-scrollbar-thumb { background: rgba(244,167,185,0.2); border-radius: 3px; }
.convo-item {
  padding: 9px 11px; border-radius: 12px; cursor: pointer; margin-bottom: 4px;
  transition: background 0.2s; border: 1px solid transparent;
  display: flex; align-items: center; gap: 7px;
}
.convo-item:hover { background: rgba(244,167,185,0.1); }
.convo-item.active { background: rgba(201,107,138,0.2); border-color: rgba(244,167,185,0.3); }
.convo-title {
  font-size: 13px; color: rgba(253,232,239,0.85);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
}
.del-btn {
  opacity: 0; transition: opacity 0.2s; cursor: pointer;
  color: rgba(244,167,185,0.55); font-size: 12px; flex-shrink: 0;
  background: none; border: none; padding: 0 2px;
}
.convo-item:hover .del-btn { opacity: 1; }

/* ── Chat panel ── */
.chat-panel {
  position: relative; z-index: 10;
  background: rgba(15,8,18,0.6);
  backdrop-filter: blur(22px) saturate(180%);
  border: 1px solid rgba(244,167,185,0.28);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset,
              0 28px 70px rgba(0,0,0,0.55),
              0 0 60px rgba(201,107,138,0.12);
  overflow: hidden; display: flex; flex-direction: column;
}
.chat-header {
  padding: 16px 20px 13px;
  background: linear-gradient(135deg, rgba(201,107,138,0.2), rgba(61,100,148,0.12));
  border-bottom: 1px solid rgba(244,167,185,0.18);
  display: flex; align-items: center; gap: 11px;
}
.avatar-ring {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #f4a7b9, #c96b8a, #8b4f7a);
  display: flex; align-items: center; justify-content: center; font-size: 19px;
  animation: avatarPulse 2.5s ease-in-out infinite;
}
@keyframes avatarPulse {
  0%,100% { box-shadow: 0 0 18px rgba(201,107,138,0.5); }
  50%      { box-shadow: 0 0 30px rgba(244,167,185,0.75); }
}
.feed-area { scrollbar-width: thin; scrollbar-color: rgba(244,167,185,0.3) transparent; }
.feed-area::-webkit-scrollbar { width: 4px; }
.feed-area::-webkit-scrollbar-thumb { background: rgba(244,167,185,0.3); border-radius: 4px; }
.bubble-user {
  background: linear-gradient(135deg, #c96b8a, #9b4f75);
  color: #fff5f8; border-radius: 22px 22px 6px 22px;
  box-shadow: 0 4px 18px rgba(201,107,138,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset;
}
.bubble-ai {
  background: rgba(255,255,255,0.07); color: #fde8ef;
  border-radius: 22px 22px 22px 6px;
  border: 1px solid rgba(244,167,185,0.22);
  box-shadow: 0 4px 18px rgba(0,0,0,0.3);
}
.file-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(244,167,185,0.14);
  border: 1px solid rgba(244,167,185,0.3);
  border-radius: 10px; padding: 5px 11px;
  font-size: 12px; color: rgba(253,232,239,0.85);
  margin-bottom: 4px;
}
.input-wrap {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(244,167,185,0.22);
  border-radius: 999px;
  transition: border-color 0.3s, box-shadow 0.3s;
  display: flex; align-items: center; flex: 1; padding: 0 12px; gap: 6px;
}
.input-wrap:focus-within {
  border-color: rgba(244,167,185,0.6);
  box-shadow: 0 0 18px rgba(201,107,138,0.22);
}
.clip-btn {
  background: none; border: none; cursor: pointer;
  color: rgba(244,167,185,0.55); display: flex; align-items: center;
  padding: 0; transition: color 0.2s; flex-shrink: 0;
}
.clip-btn:hover { color: rgba(244,167,185,1); }
.toggle-btn {
  background: rgba(244,167,185,0.1);
  border: 1px solid rgba(244,167,185,0.22);
  border-radius: 9px; color: #fde8ef; cursor: pointer;
  padding: 5px 9px; font-size: 14px; transition: background 0.2s; flex-shrink: 0;
}
.toggle-btn:hover { background: rgba(244,167,185,0.2); }
.new-chat-btn {
  background: rgba(201,107,138,0.22);
  border: 1px solid rgba(244,167,185,0.32);
  border-radius: 8px; color: #fde8ef; cursor: pointer;
  padding: 3px 10px; font-size: 19px; line-height: 1;
  transition: background 0.2s;
}
.new-chat-btn:hover { background: rgba(201,107,138,0.38); }
.dot { display:inline-block; border-radius:50%; background:rgba(244,167,185,0.8);
  animation: dotBounce 1.1s ease-in-out infinite; }
.dot:nth-child(2){animation-delay:.18s}
.dot:nth-child(3){animation-delay:.36s}
@keyframes dotBounce {
  0%,80%,100%{transform:translateY(0);opacity:0.5}
  40%{transform:translateY(-5px);opacity:1}
}
@keyframes statusBlink { 0%,100%{opacity:1} 50%{opacity:0.35} }
`;

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      if (next.length === 0) {
        const fresh = makeConvo();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const sendMessage = async () => {
    if (!message.trim() && !uploadedFile) return;
    const fileName = uploadedFile?.name;
    const userMsg: Message = { role: "user", content: message || `📎 ${fileName}`, fileName };
    const updated = [...chat, userMsg];
    updateMessages(activeId, updated);
    setMessage("");
    setUploadedFile(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("message", message);
      if (uploadedFile) formData.append("file", uploadedFile);
      const res = await axios.post("https://tech-llm-website-2.onrender.com", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateMessages(activeId, [...updated, { role: "ai", content: res.data.reply }]);
    } catch {
      updateMessages(activeId, [...updated, { role: "ai", content: "Error: Cannot load AI assistant." }]);
    } finally {
      setLoading(false);
    }
  };

  const stars = useRef(
    Array.from({ length: 70 }, (_, i) => ({
      id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 45}%`,
      size: Math.random() * 2.2 + 0.6,
      d: `${(Math.random() * 3 + 2).toFixed(1)}s`, dl: `${(Math.random() * 5).toFixed(1)}s`,
      oa: (Math.random() * 0.25 + 0.1).toFixed(2), ob: (Math.random() * 0.5 + 0.5).toFixed(2),
    }))
  ).current;

  const petals = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i, left: `${Math.random() * 110 - 5}%`, w: Math.random() * 9 + 8,
      pd: `${(Math.random() * 8 + 6).toFixed(1)}s`, dl: `${(Math.random() * 14).toFixed(1)}s`,
      drift: `${((Math.random() - 0.5) * 200).toFixed(0)}px`,
      rot: `${Math.random() > 0.5 ? 360 : -360}deg`,
    }))
  ).current;

  return (
    <ChakraProvider theme={theme}>
      <style>{sceneStyles}</style>
      <div className="sakura-root">

        {/* ── Background ── */}
        <div className="sky" />
        <div className="moon" />
        <div className="stars-layer">
          {stars.map((s) => (
            <div key={s.id} className="star" style={{ left: s.left, top: s.top, width: s.size, height: s.size, "--d": s.d, "--dl": s.dl, "--oa": s.oa, "--ob": s.ob } as React.CSSProperties} />
          ))}
        </div>
        <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"
          style={{ position: "fixed", bottom: 0, left: 0, width: "100%", height: "70%", zIndex: 1 }}>
          <polygon points="0,500 200,180 400,500" fill="#1e1535" opacity="0.88"/>
          <polygon points="150,500 420,115 690,500" fill="#251c40" opacity="0.9"/>
          <polygon points="500,500 750,75 1000,500" fill="#2d2250" opacity="0.82"/>
          <polygon points="800,500 1050,138 1300,500" fill="#1e1535" opacity="0.88"/>
          <polygon points="1100,500 1320,160 1440,310 1440,500" fill="#251c40" opacity="0.9"/>
          <polygon points="390,162 420,115 450,162" fill="rgba(255,255,255,0.5)"/>
          <polygon points="720,116 750,75 780,116" fill="rgba(255,255,255,0.55)"/>
          <polygon points="1020,180 1050,138 1080,180" fill="rgba(255,255,255,0.5)"/>
          <polygon points="0,500 180,265 360,500" fill="#3d2060" opacity="0.75"/>
          <polygon points="300,500 550,205 800,500" fill="#4a2870" opacity="0.7"/>
          <polygon points="700,500 950,235 1200,500" fill="#3d2060" opacity="0.75"/>
          <polygon points="1050,500 1250,255 1440,405 1440,500" fill="#4a2870" opacity="0.7"/>
          <ellipse cx="720" cy="495" rx="900" ry="90" fill="#120a18"/>
        </svg>
        <svg viewBox="0 0 1440 380" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"
          style={{ position: "fixed", bottom: 0, left: 0, width: "100%", height: "50%", zIndex: 2, pointerEvents: "none" }}>
          <rect x="80" y="190" width="13" height="190" fill="#1a0e18" rx="6"/>
          <ellipse cx="76" cy="182" rx="44" ry="34" fill="rgba(244,167,185,0.88)"/>
          <ellipse cx="114" cy="167" rx="38" ry="29" fill="rgba(249,195,205,0.82)"/>
          <ellipse cx="58" cy="208" rx="34" ry="27" fill="rgba(201,107,138,0.78)"/>
          <rect x="1347" y="175" width="13" height="205" fill="#1a0e18" rx="6"/>
          <ellipse cx="1360" cy="165" rx="48" ry="37" fill="rgba(244,167,185,0.88)"/>
          <ellipse cx="1322" cy="150" rx="40" ry="31" fill="rgba(249,195,205,0.82)"/>
          <ellipse cx="1384" cy="185" rx="36" ry="27" fill="rgba(201,107,138,0.78)"/>
          <rect x="222" y="272" width="9" height="108" fill="#1a0e18" rx="5"/>
          <ellipse cx="222" cy="263" rx="30" ry="22" fill="rgba(244,167,185,0.78)"/>
          <rect x="1213" y="280" width="9" height="100" fill="#1a0e18" rx="5"/>
          <ellipse cx="1213" cy="272" rx="31" ry="22" fill="rgba(244,167,185,0.78)"/>
        </svg>
        <div className="mist" style={{ bottom: "33%", height: 75, "--md": "8s" } as React.CSSProperties}/>
        <div className="mist" style={{ bottom: "27%", height: 48, "--md": "12s", opacity: 0.4 } as React.CSSProperties}/>
        {petals.map((p) => (
          <div key={p.id} className="petal-el" style={{ left: p.left, width: p.w, height: p.w * 0.76, "--pd": p.pd, "--dl": p.dl, "--drift": p.drift, "--rot": p.rot } as React.CSSProperties}/>
        ))}

        {/* ── UI Shell ── */}
        <HStack spacing={0} align="stretch" style={{ position: "relative", zIndex: 10, height: 660 }}>

          {/* SIDEBAR */}
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <MotionBox
                className="sidebar"
                key="sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 210, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ overflow: "hidden", minWidth: 0 }}
              >
                <div className="sidebar-header">
                  <Text fontSize="13px" fontWeight="600" color="rgba(253,232,239,0.9)" letterSpacing="0.07em">
                    🌸 History
                  </Text>
                  <button className="new-chat-btn" onClick={startNewChat} title="New Chat">+</button>
                </div>

                <div className="sidebar-list">
                  {conversations.map((c) => (
                    <div
                      key={c.id}
                      className={`convo-item ${c.id === activeId ? "active" : ""}`}
                      onClick={() => setActiveId(c.id)}
                    >
                      <span style={{ fontSize: 13 }}>💬</span>
                      <span className="convo-title">{c.title}</span>
                      <button className="del-btn" onClick={(e) => deleteConvo(c.id, e)} title="Delete">✕</button>
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

          {/* CHAT PANEL */}
          <Box
            className="chat-panel"
            w="430px"
            style={{
              borderLeft: sidebarOpen ? "none" : "1px solid rgba(244,167,185,0.28)",
              borderRadius: sidebarOpen ? "0 28px 28px 0" : "28px",
            }}
          >
            {/* Header */}
            <div className="chat-header">
              <button className="toggle-btn" onClick={() => setSidebarOpen((o) => !o)} title="Toggle sidebar">
                {sidebarOpen ? "◀" : "▶"}
              </button>
              <div className="avatar-ring">🌸</div>
              <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
                <Text fontSize="17px" fontWeight="600" color="#fde8ef" letterSpacing="0.04em" lineHeight={1} noOfLines={1}>
                  What Can I Do for You Today?
                </Text>
                <Text fontSize="11px" color="rgba(244,167,185,0.5)" fontWeight="300" noOfLines={1}>
                  {activeConvo?.title === "New Chat" ? "Start a conversation" : activeConvo?.title}
                </Text>
              </VStack>
              <Box w="8px" h="8px" borderRadius="full" bg="#7dffb3" boxShadow="0 0 8px #7dffb3" flexShrink={0}
                sx={{ animation: "statusBlink 2s ease-in-out infinite" }}/>
            </div>

            {/* Messages */}
            <Box flex="1" overflowY="auto" className="feed-area" p="4">
              <ScrollableFeed>
                {chat.length === 0 && (
                  <Text textAlign="center" color="rgba(244,167,185,0.35)" fontSize="sm" mt="10" fontStyle="italic" letterSpacing="0.08em">
                    ✿ ask anything under the blossoms ✿
                  </Text>
                )}
                {chat.map((c, i) => (
                  <HStack key={i} justify={c.role === "user" ? "flex-end" : "flex-start"} mb="3" align="flex-end">
                    <VStack align={c.role === "user" ? "flex-end" : "flex-start"} spacing="1">
                      {c.fileName && (
                        <div className="file-chip">
                          <span>📎</span><span>{c.fileName}</span>
                        </div>
                      )}
                      {c.content && c.content !== `📎 ${c.fileName}` && (
                        <MotionBox
                          className={c.role === "user" ? "bubble-user" : "bubble-ai"}
                          px="4" py="2.5" maxW="270px" wordBreak="break-word"
                          fontSize="15px" lineHeight="1.65"
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          {c.content}
                        </MotionBox>
                      )}
                    </VStack>
                  </HStack>
                ))}

                <AnimatePresence>
                  {loading && (
                    <MotionBox
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bubble-ai" px="4" py="2.5" display="inline-flex" alignItems="center" gap="6px" mb="3"
                    >
                      <span className="dot" style={{ width: 7, height: 7 }}/>
                      <span className="dot" style={{ width: 7, height: 7 }}/>
                      <span className="dot" style={{ width: 7, height: 7 }}/>
                    </MotionBox>
                  )}
                </AnimatePresence>
              </ScrollableFeed>
            </Box>

            {/* File preview strip */}
            <AnimatePresence>
              {uploadedFile && (
                <MotionBox
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  px="4" py="2" borderTop="1px solid rgba(244,167,185,0.12)" bg="rgba(0,0,0,0.1)"
                >
                  <HStack>
                    <Text fontSize="12px" color="rgba(244,167,185,0.8)">📎 {uploadedFile.name}</Text>
                    <Button size="xs" variant="ghost" color="rgba(244,167,185,0.6)"
                      onClick={() => setUploadedFile(null)} _hover={{ color: "#fde8ef" }} ml="auto">✕</Button>
                  </HStack>
                </MotionBox>
              )}
            </AnimatePresence>

            {/* Input row */}
            <Box px="4" pb="5" pt="3" borderTop="1px solid rgba(244,167,185,0.15)" bg="rgba(0,0,0,0.18)">
              <input
                ref={fileInputRef} type="file" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadedFile(f); e.target.value = ""; }}
              />
              <HStack>
                <div className="input-wrap">
                  <Tooltip label="Attach file" placement="top">
                    <button className="clip-btn" onClick={() => fileInputRef.current?.click()}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                      </svg>
                    </button>
                  </Tooltip>
                  <Input
                    variant="unstyled" placeholder="Whisper your question…"
                    value={message} onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    color="#fde8ef" fontSize="15px" fontFamily="'Cormorant Garamond', serif" py="2"
                    _placeholder={{ color: "rgba(244,167,185,0.45)", fontStyle: "italic" }}
                  />
                </div>
                <Button
                  onClick={sendMessage} isLoading={loading}
                  borderRadius="full" w="46px" h="46px" minW="46px" p={0}
                  bg="linear-gradient(135deg, #f4a7b9, #c96b8a)"
                  color="white" border="none"
                  boxShadow="0 4px 18px rgba(201,107,138,0.45)"
                  _hover={{ transform: "scale(1.08) rotate(-5deg)", boxShadow: "0 6px 28px rgba(201,107,138,0.65)" }}
                  _active={{ transform: "scale(0.95)" }} transition="all 0.2s"
                >
                  {!loading && (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </Button>
              </HStack>
            </Box>
          </Box>
        </HStack>
      </div>
    </ChakraProvider>
  );
}

export default App;