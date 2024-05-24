const axios = require('axios');
const { Telegraf } = require('telegraf');
const bot = new Telegraf('');
const apiKey = ''; 
const getStockData = async (TIKER) => {
    try {
const url = `https://iss.moex.com/iss/engines/stock/markets/shares/securities/${TIKER}.json`;
        const response = await axios.get(url);
        const data = await response.data;
        // Извлекаем данные о ценах акций
        const securities = data.securities.data;
        if (!securities) {
            console.log("Такой тикер не торгуется на MOEX");
            return false
        }
        const marketData = data.marketdata.data;
        return {securities,marketData}
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    }
};

bot.start((ctx) => {
    const keyboard = {
        reply_markup: {
          keyboard: [
            [{ text: 'Данные об акции' }],
            [{text:"Новости компании"}]
          ],
          resize_keyboard: true, // Опция для изменения размера клавиатуры
        },
      };
    
    ctx.reply('Добро пожаловать! Как я могу вам помочь?', keyboard);
});

bot.hears('Данные об акции', (ctx) => {
    ctx.replyWithHTML(`Введите <b>/get &lt;тикер_компании&gt;</b> для получения данных об акции.`);
});

bot.hears('Новости компании', (ctx) => {
    ctx.replyWithHTML(`Введите <b>/news &lt;тикер_компании&gt;</b> для получения последних новостей компании.`);
});

// Обработчик для текстовых сообщений
bot.command('get', async (ctx) => {
    const text = ctx.message.text.slice(5);
    console.log(text);
    let {securities,marketData} = await getStockData(text);
    if (!securities.length) {
      return ctx.reply('Данный тикер не торгуется на MOEX');
    }
    console.log(securities, marketData);
    // Получаем данные о последней акции
    const lastIndex = securities.length - 1;
    const lastSecurity = securities[lastIndex];
    const lastMarketData = marketData[lastIndex];
    // Извлекаем информацию о последней акции
    const shortName = lastSecurity[2];
    const prevPrice = lastSecurity[3];
    const name = lastSecurity[9];
    const lastPrice = lastMarketData[12]; // Индекс 12 соответствует текущей цене
    // Формируем HTML текст
    const htmlText = `Тикер: <b>${lastSecurity[0]}</b>\nНазвание: <b>${shortName} - ${name}</b>\nПредыдущая цена: <b>${prevPrice}</b>\nТекущая цена: <b>${lastPrice}</b>`;
    // Отправляем сообщение с HTML разметкой
    await ctx.replyWithHTML(htmlText);
  });

  bot.command('news', async (ctx) => {
    const ticker = ctx.message.text.slice(6);
    console.log(ticker);
    try {
        const news = await getCompanyNews(ticker);
        if (news) {
            news.forEach((item,index) => {
                ctx.replyWithHTML(`<b><a href="${item.link}">${item.title}</a></b>\n<i>${item.date}</i>`, {
                    disable_web_page_preview: true
                });
            })
        } else {
            ctx.reply('Произошла ошибка при получении новостей.');
        }
    } catch (error) {
        console.error('Произошла ошибка при получении новостей:', error.message);
        ctx.reply('Произошла ошибка при получении новостей.');
    }
});

async function getCompanyNews(ticker) {
    const url = `https://newsapi.org/v2/everything?q=${ticker}&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const articles = response.data.articles;
        let articlesFiltered = articles.filter((item) => {
            return item.publishedAt.slice(5, 7) === ((new Date().getMonth() + 1) <= 9 ? "0" + (new Date().getMonth() + 1) : (new Date().getMonth() + 1)).toString()
        }).splice(0,5);
        
        
        let text = [];
        articlesFiltered.forEach((article, index) => {
            text.push({ title: article.title.trim(), date: article.publishedAt.slice(0, 10), link: article.url.trim() });
        });
        return text;
        
    } catch (error) {
        console.error('Произошла ошибка при получении новостей:', error.message);
        return false;
    }
}

bot.launch();