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

    // @ts-ignore
    await new Promise(done => SP.SOD.executeFunc('sp.js', 'SP.ClientContext', done));
    console.log('scripts loaded!');

    SP.ClientContext.prototype.execute = function () {
        return new Promise((resolve, reject) =>
            this.executeQueryAsync(resolve, (sender, args) => reject(args.get_message()))
        );
    };

    const ctx = new SP.ClientContext(webUrl);
    const web = ctx.get_web();
    const actions = web.get_userCustomActions();

    ctx.load(actions);
    await ctx.execute();
    
    const allActions = actions.get_data();

    for (const action of allActions) {
        if (action.get_title() === 'BoxStyling') {
            action.deleteObject();
            await ctx.execute();
            console.log('deleted!');
        }
    }
    
    console.log('%cdone!', 'color: green; font-weight: bold;');

})();