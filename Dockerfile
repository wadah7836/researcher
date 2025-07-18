# =============================
# STAGE 1: Build the application
# =============================
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build

WORKDIR /src

# انسخ ملفات المشروع والحل مباشرة من root
COPY *.sln ./
COPY *.csproj ./

# استعادة الحزم
RUN dotnet restore

# انسخ كل الملفات من مجلد المشروع الحالي
COPY . ./

# بناء المشروع ونشره
RUN dotnet publish -c Release -o /app/publish --no-restore

# =============================
# STAGE 2: Create runtime image
# =============================
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS runtime

WORKDIR /app

# انسخ الملفات المنشورة
COPY --from=build /app/publish ./

EXPOSE 80

ENTRYPOINT ["dotnet", "MyResearcherApp.dll"]
