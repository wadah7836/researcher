using Microsoft.AspNetCore.Mvc.RazorPages;

namespace MyResearcherApp.Pages
{
    public class ProfileModel : PageModel
    {
        public string Username { get; set; } = "";

        public void OnGet(string? username)
        {
            // قراءة اسم المستخدم من الرابط
            Username = username ?? "";
        }
    }
}
