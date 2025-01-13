import { SlashCommandBuilder } from "discord.js";
const get = new SlashCommandBuilder()
  .setName("get_lesson")
  .setDescription("get a lesson");
export default get.toJSON();