# XPath выражения

1. **Проекты с более чем тремя исследователями**  
   Выражение: `//project[count(participants/participant) &gt; 3]`  
   Логика: считаем количество вложенных `participant` внутри каждого `project` и фильтруем по предикату `> 3`.

2. **Публикации после 2023 года**  
   Выражение: `//publication[@year &gt; 2023]`  
   Логика: навигация ко всем `publication` и числовое сравнение атрибута `year`.

3. **Проекты, использующие датасеты объёмом более 10 ГБ**  
   Выражение: `//project[datasets/datasetRef/@ref = //datasetsCatalog/dataset[number(sizeGB) &gt; 10]/@id]`  
   Логика: связываем `datasetRef/@ref` из проекта с `dataset/@id` каталога; выбираем проекты, где хотя бы один связанный датасет имеет `sizeGB` больше 10.

4. **Исследователи, участвующие более чем в одном проекте**  
   Выражение: `/universityResearch/researchers/researcher[count(/universityResearch/projects/project/participants/participant[@researcherRef = @id]) &gt; 1]`  
   Логика: для каждого `researcher` считаем предикатом, сколько раз его `@id` встречается в списках участников всех проектов; оставляем тех, для кого счётчик превышает 1.
