const fs = require("fs");

module.exports.config = {
  name: "ntc",
  version: "5.1.1",
  hasPermssion: 2,
  credits: "Asadul (Upgraded by Asadul chat bot⚠️😒)",
  description: "Send stylish notice to groups by replying with serial numbers",
  commandCategory: "admin",
  usages: "[all <msg> | list | reply with <serial(s)> <msg>]",
  cooldowns: 5
};

const OWNER_UID = ["61557500431580"]; 
const DATA_FILE = __dirname + "/ntcGroups.json";

// Save groups
function saveGroups(groups) {
  const data = {};
  let i = 1;
  for (let g of groups) {
    data[i] = {
      serial: `#${i}`,
      name: `📌 ${g.name || "Unknown"}`,
      threadID: g.threadID,
      members: `👥 ${g.participantIDs.length}`
    };
    i++;
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return data;
}

// Global state
global.ntcState = global.ntcState || { listMsgID: null, groupsData: {} };

// Stylish notice template
function makeStylishNotice(bodyMsg) {
  return `ㅤ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️𝙽𝙾𝚃𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽 𝙵𝚁𝙾𝙼 __-么 RS- __-RIFAT-_
☆━━━━━━━━━━━━━━━━━━☆
${bodyMsg}`;
}

module.exports.run = async function ({ api, event, args }) {
  try {
    if (!OWNER_UID.includes(event.senderID)) {
      return api.sendMessage("❌ You are not authorized to use ntc!", event.threadID, event.messageID);
    }

    // Load groups data if exists
    if (fs.existsSync(DATA_FILE)) {
      global.ntcState.groupsData = JSON.parse(fs.readFileSync(DATA_FILE));
    }

    // LIST COMMAND
    if (args[0] === "list") {
      const threadList = await api.getThreadList(100, null, ["INBOX"]);
      const activeGroups = threadList.filter(t => t.isGroup);
      global.ntcState.groupsData = saveGroups(activeGroups);

      let text = "📋 𝗚𝗿𝗼𝘂𝗽 𝗟𝗶𝘀𝘁 📋\n────────────────────\n";
      for (let i in global.ntcState.groupsData) {
        const g = global.ntcState.groupsData[i];
        text += `${i} ${g.name}\n🆔 UID: ${g.threadID}\n${g.members}\n\n`;
      }

      const sent = await api.sendMessage(text, event.threadID);
      global.ntcState.listMsgID = sent.messageID;
      return;
    }

    // SEND TO ALL
    else if (args[0] === "all") {
      const msg = args.slice(1).join(" ");
      if (!msg) return api.sendMessage("⚠️ Usage: ntc all <Message>", event.threadID, event.messageID);

      if (!Object.keys(global.ntcState.groupsData).length) {
        const threadList = await api.getThreadList(100, null, ["INBOX"]);
        const activeGroups = threadList.filter(t => t.isGroup);
        global.ntcState.groupsData = saveGroups(activeGroups);
      }

      const notice = makeStylishNotice(msg);
      for (let i in global.ntcState.groupsData) {
        const g = global.ntcState.groupsData[i];
        await api.sendMessage(notice, g.threadID);
      }
      return api.sendMessage(`✅ Notice sent to ${Object.keys(global.ntcState.groupsData).length} groups.`, event.threadID, event.messageID);
    }

    // DEFAULT
    else {
      return api.sendMessage("⚡ Usage: ntc [all <msg> | list | reply with <serial(s)> <msg>]", event.threadID, event.messageID);
    }

  } catch (e) {
    console.log(e);
    return api.sendMessage("❌ Error while executing ntc command!", event.threadID, event.messageID);
  }
};

// HANDLE REPLY
module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!OWNER_UID.includes(event.senderID)) return;
    if (!global.ntcState.listMsgID) return;
    if (event.type !== "message_reply") return;
    if (event.messageReply.messageID !== global.ntcState.listMsgID) return;

    const parts = event.body.trim().split(" ");
    const serials = parts.filter(x => /^\d+$/.test(x)); // শুধু সংখ্যা সিরিয়াল
    const msg = parts.filter(x => !/^\d+$/.test(x)).join(" "); // বাকিটা মেসেজ

    if (!serials.length || !msg) {
      return api.sendMessage("⚠️ Reply format: <serial(s)> <message>", event.threadID, event.messageID);
    }

    const failed = [];
    for (let s of serials) {
      const target = global.ntcState.groupsData[s];
      if (!target) { failed.push(s); continue; }

      const notice = makeStylishNotice(msg);
      await api.sendMessage(notice, target.threadID);
    }

    // Auto delete list
    await api.unsendMessage(global.ntcState.listMsgID);
    global.ntcState.listMsgID = null;

    let response = "✅ Notice sent successfully!";
    if (failed.length) response += `\n⚠️ Failed serials: ${failed.join(", ")}`;
    return api.sendMessage(response, event.threadID, event.messageID);

  } catch (err) {
    console.log(err);
  }
};
