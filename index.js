import {
  ButtonStyle,
  Client,
  GatewayIntentBits,
  InteractionType,
  REST,
  Routes,
  TextInputStyle,
} from "discord.js";
import dotenv from "dotenv";
import admin from "./commands/admin.js";
import { connectDB } from "./db/connectDB.js";
import { addOne, getLesson } from "./db/addOne.js";
import get from "./commands/get.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
} from "@discordjs/builders";
import express from  "express";
dotenv.config();

const app = express();

// بدء الخادم
const listener = app.listen(2000, () => {
  console.log(`Listening at port: ${listener.address().port}`);
});

// معالجة المسار الرئيسي
app.get("/", (req, res) => {
  res.send("<body><center><h1>Bot ready 24h</h1></center></body>");
});
// التحقق من المتغيرات
const { TOKEN, CLIENT_ID, GUILD_ID, DB, adminRole } = process.env;
if (!TOKEN || !CLIENT_ID || !GUILD_ID || !DB) {
  throw new Error("رجاء أدخل كل المتطلبات");
}
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// الاتصال بقاعدة البيانات
connectDB(DB);

// إعداد الأوامر
const rest = new REST({ version: "10" }).setToken(TOKEN);
client.on("messageCreate", async (message) => {
  if (message.content === "!addLessons") {
    try {
      const lessonsChannel = message.guild.channels.cache.find(
        (channel) => channel.name === "دروس"
      );

      if (!lessonsChannel) {
        return message.reply("القناة غير موجودة");
      }

      const fetchedMessages = await lessonsChannel.messages.fetch({
        limit: 50,
      });
      const lessons = [];

      // معالجة الرسائل واستخراج المعلومات
      fetchedMessages.forEach((msg) => {
        console.log(message.content)
        const lines = msg.content.split("\n");
        const temp = lines[1];
        const links = temp.split(" ");
        if (lines.length === 3) {
          const lesson = {
            subject: lines[0], // المادة
            link: links, // الرابط
            date: lines[2], // التاريخ
          };

          // إضافة الدرس إلى القائمة
          lessons.push(lesson);
        }
      });

      if (lessons.length === 0) {
        return message.reply("لا يوجد رسائل تحتوي على تنسيق مناسب.");
      }

      // إضافة الدروس إلى قاعدة البيانات
      for (const lesson of lessons) {
        try {
          await addOne(lesson.subject, lesson.link, lesson.date);
        } catch (error) {
          console.error(`فشل إضافة الدرس: ${lesson.subject}`, error);
        }
      }

      message.reply(`تمت إضافة ${lessons.length} درسًا إلى قاعدة البيانات.`);
    } catch (err) {
      console.error(err);
      message.reply("حدث خطأ أثناء محاولة إضافة الدروس.");
    }
  }
});
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "admin") {
      if (interaction.member.roles.cache.some((r) => r.id === adminRole)) {
        const addLessonBtn = new ActionRowBuilder().setComponents(
          new ButtonBuilder()
            .setCustomId("addLesson")
            .setLabel("أضف درس")
            .setStyle(ButtonStyle.Success)
        );
        await interaction.reply({
          content: "من هنا تستطيع إضافة درس",
          components: [addLessonBtn],
        });
      } else {
        await interaction.reply("أنت لست إداري!");
      }
    } else if (interaction.commandName === "get_lesson") {
      const addLessonBtn = new ActionRowBuilder().setComponents(
        new ButtonBuilder()
          .setCustomId("getLesson")
          .setLabel("احصل على الدرس")
          .setStyle(ButtonStyle.Success)
      );
      await interaction.reply({
        content: "اضغط على الزر ثم أدخل معلومات الزر",
        components: [addLessonBtn],
      });
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === "addLesson") {
      const modal = new ModalBuilder()
        .setCustomId("addLessonModal")
        .setTitle("إضافة درس")
        .setComponents(
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setStyle(TextInputStyle.Short)
              .setLabel("المادة")
              .setRequired(true)
              .setCustomId("subject")
          ),
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setStyle(TextInputStyle.Short)
              .setLabel("الرابط")
              .setRequired(true)
              .setCustomId("url")
          ),
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setStyle(TextInputStyle.Short)
              .setLabel("التاريخ (YYYY-MM-DD)")
              .setRequired(true)
              .setCustomId("date")
          )
        );
      await interaction.showModal(modal);
    } else if (interaction.customId === "getLesson") {
      const modal = new ModalBuilder()
        .setCustomId("getLessonModal")
        .setTitle("الحصول على درس")
        .setComponents(
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setStyle(TextInputStyle.Short)
              .setLabel("المادة")
              .setRequired(true)
              .setCustomId("subject")
          ),
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setStyle(TextInputStyle.Short)
              .setLabel("التاريخ (YYYY-MM-DD)")
              .setRequired(true)
              .setCustomId("date")
          )
        );
      await interaction.showModal(modal);
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === "addLessonModal") {
      const subject = interaction.fields.getTextInputValue("subject");
      const temp = interaction.fields.getTextInputValue("url");
      const url = temp.split(" ");
      const date = interaction.fields.getTextInputValue("date");
      try {
        await addOne(subject, url, date);
        await interaction.reply({
          content: "تم إضافة الدرس بنجاح!",
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await interaction.reply("حدث خطأ أثناء إضافة الدرس.");
      }
    } else if (interaction.customId === "getLessonModal") {
      const subject = interaction.fields.getTextInputValue("subject");
      const date = interaction.fields.getTextInputValue("date");
      const lesson = await getLesson(subject, date);
      if (lesson) {
        if (lesson.url.length > 0) {
          await interaction.reply({
            content: `تفضل الدروس: ${lesson.url.join("\n")}`,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "الرابط غير صالح أو غير متاح.",
            ephemeral: true,
          });
        }
      } else {
        await interaction.reply("لم يتم العثور على درس مطابق");
      }
    }
  }
});

(async () => {
  try {
    const commands = [admin, get];

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("Commands were loaded successfully 🎉");
  } catch (error) {
    console.error("Error loading commands:", error);
  }
})();

client.on("ready", () => {
  console.log(`${client.user.tag} is up!`);
});

// تشغيل البوت
client.login(TOKEN);
