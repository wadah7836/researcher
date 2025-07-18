var builder = WebApplication.CreateBuilder(args);

// تعيين المنفذ من متغير البيئة PORT أو 5000 كافتراضي
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";

// تأكد من تحويل port إلى int لاستخدامه بشكل صحيح في UseUrls
if (!int.TryParse(port, out var portNumber))
{
    portNumber = 5000; // إذا كان غير صالح نستخدم 5000
}

builder.WebHost.UseUrls($"http://*:{portNumber}");

builder.Services.AddRazorPages();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // تفعيل ملفات static مثل css, js, صور
app.UseRouting();
app.UseAuthorization();

app.MapRazorPages();

app.Run();
