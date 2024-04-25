(async () => {


    console.log('starting...');

    const { WebFullUrl: webUrl } = await fetch(
        location.href.split('/').slice(0,-3).join('/') + '/_api/contextinfo',
        { method: 'POST', headers: {'accept': 'application/json;odata=nometadata'}}
    ).then(r => r.json());

    if (!window.SP || !window.SP.SOD) {
        for (const fileName of ['init.js', 'MicrosoftAjax.js', 'SP.Runtime.js', 'SP.js']) {
            await /** @type {Promise<void>} */(new Promise((resolve, reject) => {
                const scriptEl = document.createElement('script');
                scriptEl.src = webUrl + '/_layouts/15/' + fileName;
                scriptEl.addEventListener('load', () => resolve());
                scriptEl.addEventListener('error', () => reject());
                document.head.appendChild(scriptEl);
            }))
        }
    }

    
    await /** @type {Promise<void>} */(new Promise(done => SP.SOD.executeFunc('sp.js', 'SP.ClientContext', done)));
    console.log('scripts loaded!');

    SP.ClientContext.prototype.execute = function () {
        return new Promise((resolve, reject) =>
            this.executeQueryAsync(resolve, (sender, args) => reject(args.get_message()))
        );
    };

    const ctx = new SP.ClientContext(webUrl);
    const web = ctx.get_web();
    const actionsCollection = web.get_userCustomActions();

    ctx.load(actionsCollection);
    await ctx.execute();

    const allActions = actionsCollection.get_data();

    const action = allActions.find(a => a.get_title() === "BoxStyling") ?? actionsCollection.add();

    action.set_location("ScriptLink");
    action.set_title("BoxStyling");
    action.set_description("Styles the promoted link boxes.");

    const block = `
        (function() {
            
            const cssEl = document.createElement('style');
            cssEl.textContent = \`
                .ms-promlink-body {
                    width: 100% !important;
                }
                .ms-promlink-header {
                    display: none !important;        
                }
            \`;
            document.head.appendChild(cssEl);

        })();
    `;

    action.set_scriptBlock(block);
    action.set_sequence(1000);
    action.update();

    await ctx.execute();
    console.log('%cdone!', 'color: green; font-weight: bold;');

})();