import { withPluginApi } from "discourse/lib/plugin-api";
import { startPageTracking } from 'discourse/lib/page-tracker';
import { viewTrackingRequired } from 'discourse/lib/ajax';
import showModal from "discourse/lib/show-modal";

export default {
  name: "content-gate",
  after: 'inject-objects',

  initialize(container) {
    withPluginApi("0.8", (api) => {
      const currentUser = api.getCurrentUser();
      let hideUserGroup = false;
      
      var pageView = 0;
      // Tell our AJAX system to track a page transition
      const router = container.lookup('router:main');
      router.on('willTransition', viewTrackingRequired);
      
      let appEvents = container.lookup('service:app-events');
      startPageTracking(router, appEvents);
      var gateShownOnce = false;

      api.onPageChange((url, title) => {  
        const path = window.location.pathname;

        let urlShowMatch;
        let urlHideMatch;
        
        if(settings.url_for_show.length) {
          const allowedPaths = settings.url_for_show.split("|");
          urlShowMatch = allowedPaths.some((allowedPath) => {
            if(allowedPath.slice(-1) === "*") {
              return path.indexOf(allowedPath.slice(0, -1)) === 0;
            }
            return path === allowedPath;
          });
        }
        
        if(settings.url_for_hide.length) {
          const disallowedPaths = settings.url_for_hide.split("|");
          urlHideMatch = disallowedPaths.some((disallowedPaths) => {
            if(disallowedPaths.slice(-1) === "*") {
              return path.indexOf(disallowedPaths.slice(0, -1)) === 0;
            }
            return path === disallowedPaths;
          });
        } 
        
        if (currentUser.groups){
          for (var i=0; i < currentUser.groups.length; i++) {
            if (settings.hide_for_groups.split("|").includes(currentUser.groups[i].name)){
              hideUserGroup = true;
            }
          }
        }
        
        var maxViews = parseInt(settings.max_content_gate_page_views);
        pageView++;     
        var hitMaxViews = pageView >= maxViews;
        var showGateBool = hitMaxViews && !gateShownOnce;
        
        if (showGateBool && !hideUserGroup && urlShowMatch && !urlHideMatch) {
          if (settings.content_gate_show_only_once) {
            gateShownOnce = true;
          }
          pageView = getRandomInt(0, maxViews + 1);
          
          showModal("content-gate");
        }
      });
    });
  }
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
