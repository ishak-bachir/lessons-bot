import { SlashCommandBuilder } from "discord.js";
const admin = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Command that sends admin pannel");
export default admin.toJSON();