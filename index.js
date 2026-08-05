const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
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
    console.log(`✅ البوت شغال وجاهز! الحساب: ${client.user.tag}`);
});

// 📌 1. أمر إرسال لوحة الراديو
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup-radio') {
        const embed = new EmbedBuilder()
            .setTitle('📻 | روم الراديو')
            .setDescription(
                'من خلال روم الراديو تقدر تسوي موجة خاصة فيك بكل سهولة وتعطي رقمها لأي شخص تبيه يدخل معك بنفس الموجة وتكون المحادثة خاصة بينكم فقط وما يقدر أي شخص تشوفها أو يدخلها إلا إذا كان معه رقم الموجة. ويعتبر استخدام الراديو رول بلاي لذلك لازم يكون استخدامه بشكل واقعي ومتوافق مع قوانين السيرفر.\n\n' +
                '**الشروط:**\n' +
                '• يمنع استخدام الموجات من 1 إلى 10 لأنها مخصصة للإدارة والجهات الرسمية.\n' +
                '• الراديو يعتبر رول بلاي وأي استخدام غير واقعي يعرضك للمخالفة.\n' +
                '• يمنع الكتابة داخل الموجات ويجب الاعتماد على التحدث الصوتي فقط.\n' +
                '• يمنع استخدام الموجات للتنسيق على أمور مخالفة للقوانين.\n' +
                '• الالتزام بجميع قوانين السيرفر أثناء استخدام الراديو.'
            )
            .setColor('#101010');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_radio_modal')
                .setLabel('📻 الاتصال بالموجة')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// 📌 2. معالجة الضغط على الزر وإدخال رقم الموجة
client.on('interactionCreate', async (interaction) => {

    // فتح النافذة (Modal)
    if (interaction.isButton() && interaction.customId === 'open_radio_modal') {
        const modal = new ModalBuilder()
            .setCustomId('radio_modal_submit')
            .setTitle('رقم الموجة');

        const waveInput = new TextInputBuilder()
            .setCustomId('wave_pass_input')
            .setLabel('أدخل رقم الموجة... مثال : 71.23')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('71.23')
            .setRequired(true)
            .setMaxLength(10);

        const actionRow = new ActionRowBuilder().addComponents(waveInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
        return;
    }

    // معالجة إدخال رقم الموجة والربط بها
    if (interaction.isModalSubmit() && interaction.customId === 'radio_modal_submit') {
        const waveNumber = interaction.fields.getTextInputValue('wave_pass_input').trim();
        const guild = interaction.guild;
        const member = interaction.member;

        // التأكد أن العضو داخل روم صوتي
        if (!member.voice.channel) {
            return interaction.reply({
                content: '❌ يجب أن تكون متواجدًا في أي روم صوتي أولاً للاتصال بالراديو!',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        // اسم الروم المخفي في الكواليس
        const channelName = `موجة-${waveNumber}`;

        try {
            // البحث عما إذا كانت الموجة أنشئت مسبقاً من شخص آخر
            let targetChannel = guild.channels.cache.find(
                c => c.name === channelName && c.type === ChannelType.GuildVoice
            );

            if (!targetChannel) {
                // إذا لم تكن موجودة، ينشئ البوت الروم مخفي عن الجميع
                targetChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: member.voice.channel.parentId || null,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel] // مخفية عن الجميع
                        },
                        {
                            id: member.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.Connect,
                                PermissionFlagsBits.Speak
                            ]
                        }
                    ]
                });
            } else {
                // إذا كانت الموجة موجودة مسبقاً، يعطي الشخص الجديد صلاحية دخولها
                await targetChannel.permissionOverwrites.edit(member.id, {
                    ViewChannel: true,
                    Connect: true,
                    Speak: true
                });
            }

            // نقل العضو إلى روم الموجة
            await member.voice.setChannel(targetChannel);

            // إرسال نفس الرسالة التأكيدية
            await interaction.editReply({
                content: `تم إنشاء موجة **${waveNumber}** ونقلك إليها! القناة خاصة — شارك الرقم فقط مع من تريد.`
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: '❌ حدث خطأ! تأكد من إعطاء البوت صلاحيات إدارة القنوات (Manage Channels) ونقل الأعضاء (Move Members).'
            });
        }
    }
});

// ضع توكين البوت الخاص بك هنا
client.login('MTUzNDQ1MTY4NjIyNjI2NDA4NA.GHV-LT.SPElZ3OxAIQlKKrV7-It8yfX0B3U5W1_pDhsTw');
