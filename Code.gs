function doGet(e) {
  var template = HtmlService.createTemplateFromFile('login');
  return template.evaluate()
      .setTitle('EzBook Login')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}