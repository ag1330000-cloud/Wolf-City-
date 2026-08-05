const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    TextInputBuilder,
    TextStyle,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup-radio') {
        const embed = new EmbedBuilder()
            .setTitle('راديو المدينة')
            .setDescription('اضغط على الرابط أسفله للربط بالراديو الخاص بك.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_radio_modal')
                .setLabel('ربط الراديو')
                .setStyle(1)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'open_radio_modal') {
        const modal = {
            title: 'إعدادات الراديو',
            customId: 'radio_modal_submit',
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            customId: 'wave_pass_input',
                            label: 'التردد (مثال: 71.23)',
                            style: 1,
                            required: true
                        }
                    ]
                }
            ]
        };

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'radio_modal_submit') {
        const wavePass = interaction.fields.getTextInputValue('wave_pass_input');

        if (!interaction.member.voice.channel) {
            return interaction.reply({
                content: 'يجب أن تكون متواجداً في أي روم صوتي أولاً لربط الراديو!',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const targetChannel = interaction.guild.channels.cache.find(
                (c) => c.name === `راديو | ${wavePass}` && c.type === ChannelType.GuildVoice
            );

            if (targetChannel) {
                await targetChannel.permissionOverwrites.edit(interaction.member.id, {
                    ViewChannel: true,
                    Connect: true,
                    Speak: true
                });

                await interaction.member.voice.setChannel(targetChannel);

                await interaction.editReply({
                    content: `تم إعطاؤك الصلاحية وتم نقلك إلى الراديو رقم ${wavePass}`
                });
            } else {
                await interaction.editReply({
                    content: 'صوت التردد غير موجود، تأكد من إدخال اسم الراديو الصحيح.'
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: 'حدث خطأ أثناء إجراء العملية، تأكد من إعطاء البوت صلاحيات إدارة الرومات.'
            });
        }
    }
});

client.login('MTUzNDQ1MTY4NjIyNjI2NDA4NA.G8Ngje.FP5vIkyh93fsTELfksFFLaWMwj0dVGgAFbtGnw');
